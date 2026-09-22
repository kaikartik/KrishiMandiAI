import { supabase } from './client';

export type PrototypeAnalysisResult = {
  id: string;
  assessment_id: string;
  grain_coverage: number | null;
  damaged_grains: number | null;
  broken_grains: number | null;
  foreign_material: number | null;
  quality_score: number | null;
  quality_grade: string | null;
  analysis_engine: string;
  created_at: string;
};

type ProcessAssessmentResult = {
  assessmentId: string;
  result: PrototypeAnalysisResult;
};

export async function processGrainAssessment(
  imageUri: string,
  cropId: string,
): Promise<ProcessAssessmentResult> {
  if (!imageUri) {
    throw new Error(
      'No captured image was provided.',
    );
  }

  if (!cropId) {
    throw new Error(
      'No crop was selected.',
    );
  }

  // ----------------------------------------------------------
  // Get authenticated user
  // ----------------------------------------------------------

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      userError.message ||
        'Unable to identify the signed-in user.',
    );
  }

  const user = userData.user;

  if (!user) {
    throw new Error(
      'You must be signed in to process a sample.',
    );
  }

  // ----------------------------------------------------------
  // Read captured image
  // ----------------------------------------------------------

  const imageBuffer =
    await fetch(imageUri).then(
      (response) => {
        if (!response.ok) {
          throw new Error(
            'Unable to read the captured image.',
          );
        }

        return response.arrayBuffer();
      },
    );

  // ----------------------------------------------------------
  // Create assessment using the EXISTING schema
  //
  // crop_id is required.
  // assessment_mode defaults to quick, but we set it
  // explicitly for clarity.
  //
  // sample_count = 1 because this is currently the
  // single-sample flow.
  // ----------------------------------------------------------

  const {
    data: assessment,
    error: assessmentError,
  } = await supabase
    .from('assessments')
    .insert({
      user_id: user.id,
      crop_id: cropId,
      assessment_mode: 'quick',
      status: 'pending',
      sample_count: 1,
      analysis_engine: 'prototype',
    })
    .select('id')
    .single();

  if (
    assessmentError ||
    !assessment
  ) {
    throw new Error(
      assessmentError?.message ||
        'Unable to create assessment.',
    );
  }

  const assessmentId =
    assessment.id;

  // ----------------------------------------------------------
  // Upload image
  //
  // user-id / assessment-id / sample.jpg
  // ----------------------------------------------------------

  const storagePath =
    `${user.id}/${assessmentId}/sample.jpg`;

  const {
    error: uploadError,
  } = await supabase.storage
    .from('grain-samples')
    .upload(
      storagePath,
      imageBuffer,
      {
        contentType: 'image/jpeg',
        upsert: false,
      },
    );

  if (uploadError) {
    await supabase
      .from('assessments')
      .update({
        status: 'failed',
      })
      .eq('id', assessmentId)
      .eq('user_id', user.id);

    throw new Error(
      uploadError.message ||
        'Unable to upload the grain sample.',
    );
  }

  // ----------------------------------------------------------
  // Save image path and mark assessment as processing
  // ----------------------------------------------------------

  const {
    error: pathError,
  } = await supabase
    .from('assessments')
    .update({
      image_path: storagePath,
      status: 'processing',
    })
    .eq('id', assessmentId)
    .eq('user_id', user.id);

  if (pathError) {
    await supabase
      .from('assessments')
      .update({
        status: 'failed',
      })
      .eq('id', assessmentId)
      .eq('user_id', user.id);

    throw new Error(
      pathError.message ||
        'Unable to save the sample reference.',
    );
  }

  // ----------------------------------------------------------
  // Run prototype analysis in Supabase
  // ----------------------------------------------------------

  const {
    data: analysis,
    error: analysisError,
  } =
    await supabase.rpc(
      'generate_prototype_analysis',
      {
        p_assessment_id:
          assessmentId,
      },
    );

  if (
    analysisError ||
    !analysis
  ) {
    await supabase
      .from('assessments')
      .update({
        status: 'failed',
      })
      .eq('id', assessmentId)
      .eq('user_id', user.id);

    throw new Error(
      analysisError?.message ||
        'Unable to generate the sample analysis.',
    );
  }

  return {
    assessmentId,
    result:
      analysis as PrototypeAnalysisResult,
  };
}