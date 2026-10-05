import {
  InferenceSession,
  Tensor,
} from 'onnxruntime-react-native';

import RNFS from 'react-native-fs';
import { loadImage } from 'react-native-nitro-image';

const MODEL_ASSET = 'best.onnx';
const CLASSIFIER_MODEL_ASSET =
  'grain_classifier.onnx';

const IMAGE_SIZE = 640;
const CLASSIFIER_IMAGE_SIZE = 224;

const CONFIDENCE_THRESHOLD = 0.25;
const IOU_THRESHOLD = 0.45;

const CLASSIFIER_CONFIDENCE_THRESHOLD = 0.0;

const GRAIN_CROP_PADDING = 0.10;

// TEMPORARY DEBUGGING
const DEBUG_SAVE_CLASSIFIER_CROPS = true;

const CLASS_NAMES = [
  'Broken',
  'Chalky',
  'Clean',
  'Damaged',
  'Discolored',
  'Immature',
  'Organic Foreign Matters',
];

const CLASSIFIER_CLASS_NAMES = [
  'Broken',
  'Chalky',
  'Clean',
  'Damaged',
  'Discolored',
  'Immature',
  'Organic_Foreign_Matters',
];

const IMAGENET_MEAN = [
  0.485,
  0.456,
  0.406,
];

const IMAGENET_STD = [
  0.229,
  0.224,
  0.225,
];

export type LocalDetection = {
  classId: number;
  className: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type ClassifierInputResult = {
  inputData: Float32Array;
  rgbPixels: Uint8Array;
};

let session: InferenceSession | null = null;

let classifierSession:
  InferenceSession | null = null;

export async function loadLocalMlModel(): Promise<void> {
  if (
    session &&
    classifierSession
  ) {
    return;
  }

  const modelPath =
    `${RNFS.CachesDirectoryPath}/best.onnx`;

  const classifierModelPath =
    `${RNFS.CachesDirectoryPath}/grain_classifier.onnx`;

  if (!(await RNFS.exists(modelPath))) {
    await RNFS.copyFileAssets(
      MODEL_ASSET,
      modelPath,
    );
  }

  if (
    !(await RNFS.exists(classifierModelPath))
  ) {
    await RNFS.copyFileAssets(
      CLASSIFIER_MODEL_ASSET,
      classifierModelPath,
    );
  }

  if (!(await RNFS.exists(modelPath))) {
    throw new Error(
      'Local YOLO model could not be prepared.',
    );
  }

  if (
    !(await RNFS.exists(classifierModelPath))
  ) {
    throw new Error(
      'Local grain classifier model could not be prepared.',
    );
  }

  session =
    await InferenceSession.create(
      modelPath,
    );

  classifierSession =
    await InferenceSession.create(
      classifierModelPath,
    );

  console.log(
    '[LocalML] YOLO ONNX model loaded successfully.',
  );

  console.log(
    '[LocalML] Classifier ONNX model loaded successfully.',
  );

  console.log(
    '[LocalML] YOLO input names:',
    session.inputNames,
  );

  console.log(
    '[LocalML] YOLO output names:',
    session.outputNames,
  );

  console.log(
    '[LocalML] Classifier input names:',
    classifierSession.inputNames,
  );

  console.log(
    '[LocalML] Classifier output names:',
    classifierSession.outputNames,
  );
}

function calculateIoU(
  a: LocalDetection,
  b: LocalDetection,
): number {
  const x1 = Math.max(a.x1, b.x1);
  const y1 = Math.max(a.y1, b.y1);
  const x2 = Math.min(a.x2, b.x2);
  const y2 = Math.min(a.y2, b.y2);

  const intersectionWidth =
    Math.max(0, x2 - x1);

  const intersectionHeight =
    Math.max(0, y2 - y1);

  const intersection =
    intersectionWidth *
    intersectionHeight;

  const areaA =
    Math.max(0, a.x2 - a.x1) *
    Math.max(0, a.y2 - a.y1);

  const areaB =
    Math.max(0, b.x2 - b.x1) *
    Math.max(0, b.y2 - b.y1);

  const union =
    areaA +
    areaB -
    intersection;

  if (union <= 0) {
    return 0;
  }

  return intersection / union;
}

function applyNms(
  detections: LocalDetection[],
): LocalDetection[] {
  const sorted = [...detections].sort(
    (a, b) =>
      b.confidence - a.confidence,
  );

  const kept: LocalDetection[] = [];

  while (sorted.length > 0) {
    const best = sorted.shift();

    if (!best) {
      break;
    }

    kept.push(best);

    for (
      let index = sorted.length - 1;
      index >= 0;
      index -= 1
    ) {
      const candidate =
        sorted[index];

      if (
        candidate.classId ===
          best.classId &&
        calculateIoU(
          best,
          candidate,
        ) > IOU_THRESHOLD
      ) {
        sorted.splice(index, 1);
      }
    }
  }

  return kept;
}

function parseYoloOutput(
  output: Tensor,
): LocalDetection[] {
  const data =
    output.data as Float32Array;

  const dims = output.dims;

  if (
    dims.length !== 3 ||
    dims[0] !== 1 ||
    dims[1] !== 11 ||
    dims[2] !== 8400
  ) {
    throw new Error(
      `Unexpected YOLO output shape: ${dims.join(' x ')}`,
    );
  }

  const candidateCount =
    dims[2];

  const detections:
    LocalDetection[] = [];

  for (
    let candidate = 0;
    candidate < candidateCount;
    candidate += 1
  ) {
    const x =
      data[candidate];

    const y =
      data[
        candidateCount +
          candidate
      ];

    const width =
      data[
        candidateCount * 2 +
          candidate
      ];

    const height =
      data[
        candidateCount * 3 +
          candidate
      ];

    let bestClassId = -1;
    let bestConfidence = 0;

    for (
      let classId = 0;
      classId < CLASS_NAMES.length;
      classId += 1
    ) {
      const confidence =
        data[
          candidateCount *
            (4 + classId) +
            candidate
        ];

      if (
        confidence >
        bestConfidence
      ) {
        bestConfidence =
          confidence;

        bestClassId =
          classId;
      }
    }

    if (
      bestClassId < 0 ||
      bestConfidence <
        CONFIDENCE_THRESHOLD
    ) {
      continue;
    }

    const x1 =
      Math.max(
        0,
        x - width / 2,
      );

    const y1 =
      Math.max(
        0,
        y - height / 2,
      );

    const x2 =
      Math.min(
        IMAGE_SIZE,
        x + width / 2,
      );

    const y2 =
      Math.min(
        IMAGE_SIZE,
        y + height / 2,
      );

    detections.push({
      classId: bestClassId,
      className:
        CLASS_NAMES[bestClassId],
      confidence:
        bestConfidence,
      x1,
      y1,
      x2,
      y2,
    });
  }

  return applyNms(detections);
}

function createLetterboxedInput(
  image: Awaited<
    ReturnType<typeof loadImage>
  >,
): Float32Array {
  const scale =
    Math.min(
      IMAGE_SIZE / image.width,
      IMAGE_SIZE / image.height,
    );

  const resizedWidth =
    Math.max(
      1,
      Math.round(
        image.width * scale,
      ),
    );

  const resizedHeight =
    Math.max(
      1,
      Math.round(
        image.height * scale,
      ),
    );

  console.log(
    '[LocalML] Letterbox:',
    image.width,
    'x',
    image.height,
    '->',
    resizedWidth,
    'x',
    resizedHeight,
  );

  const resized =
    image.resize(
      resizedWidth,
      resizedHeight,
    );

  const raw =
    resized.toRawPixelData();

  console.log(
    '[LocalML] Letterbox pixel format:',
    raw.pixelFormat,
  );

  const pixels =
    new Uint8Array(
      raw.buffer,
    );

  const inputData =
    new Float32Array(
      3 *
        IMAGE_SIZE *
        IMAGE_SIZE,
    );

  const pixelCount =
    IMAGE_SIZE *
    IMAGE_SIZE;

  const paddingValue =
    114 / 255;

  inputData.fill(
    paddingValue,
  );

  const offsetX =
    Math.floor(
      (IMAGE_SIZE -
        resizedWidth) /
        2,
    );

  const offsetY =
    Math.floor(
      (IMAGE_SIZE -
        resizedHeight) /
        2,
    );

  for (
    let y = 0;
    y < resizedHeight;
    y += 1
  ) {
    for (
      let x = 0;
      x < resizedWidth;
      x += 1
    ) {
      const sourceIndex =
        (y *
          resizedWidth +
          x) *
        4;

      let r: number;
      let g: number;
      let b: number;

      if (
        raw.pixelFormat ===
        'RGBA'
      ) {
        r =
          pixels[sourceIndex];

        g =
          pixels[
            sourceIndex + 1
          ];

        b =
          pixels[
            sourceIndex + 2
          ];
      } else if (
        raw.pixelFormat ===
        'BGRA'
      ) {
        b =
          pixels[sourceIndex];

        g =
          pixels[
            sourceIndex + 1
          ];

        r =
          pixels[
            sourceIndex + 2
          ];
      } else {
        throw new Error(
          `Unsupported pixel format: ${raw.pixelFormat}`,
        );
      }

      const targetX =
        x + offsetX;

      const targetY =
        y + offsetY;

      const targetIndex =
        targetY *
          IMAGE_SIZE +
        targetX;

      inputData[targetIndex] =
        r / 255;

      inputData[
        pixelCount +
          targetIndex
      ] =
        g / 255;

      inputData[
        pixelCount * 2 +
          targetIndex
      ] =
        b / 255;
    }
  }

  return inputData;
}

function getLetterboxTransform(
  imageWidth: number,
  imageHeight: number,
) {
  const scale =
    Math.min(
      IMAGE_SIZE / imageWidth,
      IMAGE_SIZE / imageHeight,
    );

  const resizedWidth =
    Math.max(
      1,
      Math.round(
        imageWidth * scale,
      ),
    );

  const resizedHeight =
    Math.max(
      1,
      Math.round(
        imageHeight * scale,
      ),
    );

  const offsetX =
    Math.floor(
      (IMAGE_SIZE -
        resizedWidth) /
        2,
    );

  const offsetY =
    Math.floor(
      (IMAGE_SIZE -
        resizedHeight) /
        2,
    );

  return {
    scale,
    resizedWidth,
    resizedHeight,
    offsetX,
    offsetY,
  };
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.max(
    minimum,
    Math.min(
      maximum,
      value,
    ),
  );
}

function bilinearSample(
  pixels: Uint8Array,
  pixelFormat: string,
  width: number,
  height: number,
  x: number,
  y: number,
): [number, number, number] {
  const clampedX =
    clamp(
      x,
      0,
      width - 1,
    );

  const clampedY =
    clamp(
      y,
      0,
      height - 1,
    );

  const x0 =
    Math.floor(clampedX);

  const y0 =
    Math.floor(clampedY);

  const x1 =
    Math.min(
      width - 1,
      x0 + 1,
    );

  const y1 =
    Math.min(
      height - 1,
      y0 + 1,
    );

  const fx =
    clampedX - x0;

  const fy =
    clampedY - y0;

  function readPixel(
    px: number,
    py: number,
  ): [number, number, number] {
    const index =
      (py * width + px) *
      4;

    let r: number;
    let g: number;
    let b: number;

    if (
      pixelFormat ===
      'RGBA'
    ) {
      r = pixels[index];
      g = pixels[index + 1];
      b = pixels[index + 2];
    } else if (
      pixelFormat ===
      'BGRA'
    ) {
      b = pixels[index];
      g = pixels[index + 1];
      r = pixels[index + 2];
    } else {
      throw new Error(
        `Unsupported pixel format: ${pixelFormat}`,
      );
    }

    return [r, g, b];
  }

  const p00 =
    readPixel(x0, y0);

  const p10 =
    readPixel(x1, y0);

  const p01 =
    readPixel(x0, y1);

  const p11 =
    readPixel(x1, y1);

  const r =
    p00[0] * (1 - fx) * (1 - fy) +
    p10[0] * fx * (1 - fy) +
    p01[0] * (1 - fx) * fy +
    p11[0] * fx * fy;

  const g =
    p00[1] * (1 - fx) * (1 - fy) +
    p10[1] * fx * (1 - fy) +
    p01[1] * (1 - fx) * fy +
    p11[1] * fx * fy;

  const b =
    p00[2] * (1 - fx) * (1 - fy) +
    p10[2] * fx * (1 - fy) +
    p01[2] * (1 - fx) * fy +
    p11[2] * fx * fy;

  return [r, g, b];
}

function createClassifierInput(
  pixels: Uint8Array,
  pixelFormat: string,
  imageWidth: number,
  imageHeight: number,
  detection: LocalDetection,
  transform: {
    scale: number;
    offsetX: number;
    offsetY: number;
  },
): ClassifierInputResult {
  /*
   * Detection coordinates are in the
   * 640x640 letterboxed image.
   *
   * Convert them back to original-image
   * coordinates first.
   */

  const boxX1 =
    (detection.x1 -
      transform.offsetX) /
    transform.scale;

  const boxY1 =
    (detection.y1 -
      transform.offsetY) /
    transform.scale;

  const boxX2 =
    (detection.x2 -
      transform.offsetX) /
    transform.scale;

  const boxY2 =
    (detection.y2 -
      transform.offsetY) /
    transform.scale;

  const boxWidth =
    boxX2 - boxX1;

  const boxHeight =
    boxY2 - boxY1;

  /*
   * Reproduce the classifier dataset's
   * 10% padding on each side.
   */

  const paddingX =
    boxWidth *
    GRAIN_CROP_PADDING;

  const paddingY =
    boxHeight *
    GRAIN_CROP_PADDING;

  const cropX1 =
    clamp(
      boxX1 - paddingX,
      0,
      imageWidth - 1,
    );

  const cropY1 =
    clamp(
      boxY1 - paddingY,
      0,
      imageHeight - 1,
    );

  const cropX2 =
    clamp(
      boxX2 + paddingX,
      1,
      imageWidth,
    );

  const cropY2 =
    clamp(
      boxY2 + paddingY,
      1,
      imageHeight,
    );

  const cropWidth =
    Math.max(
      1,
      cropX2 - cropX1,
    );

  const cropHeight =
    Math.max(
      1,
      cropY2 - cropY1,
    );

  const inputData =
    new Float32Array(
      3 *
        CLASSIFIER_IMAGE_SIZE *
        CLASSIFIER_IMAGE_SIZE,
    );

  const rgbPixels =
    new Uint8Array(
      3 *
        CLASSIFIER_IMAGE_SIZE *
        CLASSIFIER_IMAGE_SIZE,
    );

  const pixelCount =
    CLASSIFIER_IMAGE_SIZE *
    CLASSIFIER_IMAGE_SIZE;

  /*
   * This is equivalent to resizing the
   * padded crop directly to 224x224.
   */

  for (
    let y = 0;
    y < CLASSIFIER_IMAGE_SIZE;
    y += 1
  ) {
    const sourceY =
      cropY1 +
      ((y + 0.5) /
        CLASSIFIER_IMAGE_SIZE) *
        cropHeight -
      0.5;

    for (
      let x = 0;
      x < CLASSIFIER_IMAGE_SIZE;
      x += 1
    ) {
      const sourceX =
        cropX1 +
        ((x + 0.5) /
          CLASSIFIER_IMAGE_SIZE) *
          cropWidth -
        0.5;

      const [
        r,
        g,
        b,
      ] =
        bilinearSample(
          pixels,
          pixelFormat,
          imageWidth,
          imageHeight,
          sourceX,
          sourceY,
        );

      const red =
        clamp(
          Math.round(r),
          0,
          255,
        );

      const green =
        clamp(
          Math.round(g),
          0,
          255,
        );

      const blue =
        clamp(
          Math.round(b),
          0,
          255,
        );

      const index =
        y *
          CLASSIFIER_IMAGE_SIZE +
        x;

      /*
       * RGB debug image.
       */
      rgbPixels[index] =
        red;

      rgbPixels[
        pixelCount + index
      ] =
        green;

      rgbPixels[
        pixelCount * 2 + index
      ] =
        blue;

      /*
       * ImageNet normalization.
       */
      const normalizedR =
        (red / 255 -
          IMAGENET_MEAN[0]) /
        IMAGENET_STD[0];

      const normalizedG =
        (green / 255 -
          IMAGENET_MEAN[1]) /
        IMAGENET_STD[1];

      const normalizedB =
        (blue / 255 -
          IMAGENET_MEAN[2]) /
        IMAGENET_STD[2];

      inputData[index] =
        normalizedR;

      inputData[
        pixelCount + index
      ] =
        normalizedG;

      inputData[
        pixelCount * 2 + index
      ] =
        normalizedB;
    }
  }

  console.log(
    '[LocalML] Crop original bbox:',
    boxX1.toFixed(1),
    boxY1.toFixed(1),
    boxX2.toFixed(1),
    boxY2.toFixed(1),
  );

  console.log(
    '[LocalML] Crop padded bbox:',
    cropX1.toFixed(1),
    cropY1.toFixed(1),
    cropX2.toFixed(1),
    cropY2.toFixed(1),
  );

  return {
    inputData,
    rgbPixels,
  };
}

function uint8ArrayToBase64(
  bytes: Uint8Array,
): string {
  const base64Characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  let result = '';

  for (
    let index = 0;
    index < bytes.length;
    index += 3
  ) {
    const byte1 =
      bytes[index];

    const hasByte2 =
      index + 1 <
      bytes.length;

    const hasByte3 =
      index + 2 <
      bytes.length;

    const byte2 =
      hasByte2
        ? bytes[index + 1]
        : 0;

    const byte3 =
      hasByte3
        ? bytes[index + 2]
        : 0;

    const triple =
      (byte1 << 16) |
      (byte2 << 8) |
      byte3;

    result +=
      base64Characters[
        (triple >> 18) &
          63
      ];

    result +=
      base64Characters[
        (triple >> 12) &
          63
      ];

    result +=
      hasByte2
        ? base64Characters[
            (triple >> 6) &
              63
          ]
        : '=';

    result +=
      hasByte3
        ? base64Characters[
            triple & 63
          ]
        : '=';
  }

  return result;
}

function createBmpBase64(
  rgbPixels: Uint8Array,
): string {
  const width =
    CLASSIFIER_IMAGE_SIZE;

  const height =
    CLASSIFIER_IMAGE_SIZE;

  const rowStride =
    Math.ceil(
      (width * 3) / 4,
    ) * 4;

  const pixelDataSize =
    rowStride * height;

  const fileSize =
    54 + pixelDataSize;

  const bytes =
    new Uint8Array(
      fileSize,
    );

  const view =
    new DataView(
      bytes.buffer,
    );

  /*
   * BMP file header.
   */
  bytes[0] = 0x42;
  bytes[1] = 0x4d;

  view.setUint32(
    2,
    fileSize,
    true,
  );

  view.setUint32(
    10,
    54,
    true,
  );

  /*
   * DIB header.
   */
  view.setUint32(
    14,
    40,
    true,
  );

  view.setInt32(
    18,
    width,
    true,
  );

  view.setInt32(
    22,
    height,
    true,
  );

  view.setUint16(
    26,
    1,
    true,
  );

  view.setUint16(
    28,
    24,
    true,
  );

  view.setUint32(
    30,
    0,
    true,
  );

  view.setUint32(
    34,
    pixelDataSize,
    true,
  );

  /*
   * BMP stores pixels bottom-to-top
   * and uses BGR order.
   */
  for (
    let y = 0;
    y < height;
    y += 1
  ) {
    const sourceY =
      height - 1 - y;

    const rowStart =
      54 +
      y * rowStride;

    for (
      let x = 0;
      x < width;
      x += 1
    ) {
      const sourceIndex =
        sourceY * width +
        x;

      const targetIndex =
        rowStart +
        x * 3;

      bytes[targetIndex] =
        rgbPixels[
          2 * width * height +
            sourceIndex
        ];

      bytes[
        targetIndex + 1
      ] =
        rgbPixels[
          width * height +
            sourceIndex
        ];

      bytes[
        targetIndex + 2
      ] =
        rgbPixels[
          sourceIndex
        ];
    }
  }

  return uint8ArrayToBase64(
    bytes,
  );
}

async function saveClassifierCrop(
  rgbPixels: Uint8Array,
  index: number,
): Promise<void> {
  if (
    !DEBUG_SAVE_CLASSIFIER_CROPS
  ) {
    return;
  }

  const directory =
    `${RNFS.ExternalCachesDirectoryPath}/KrishiMandiAI_classifier_crops`;

  if (
    !(await RNFS.exists(directory))
  ) {
    await RNFS.mkdir(directory);
  }

  const filename =
    `crop_${String(index + 1).padStart(2, '0')}.bmp`;

  const path =
    `${directory}/${filename}`;

  const base64 =
    createBmpBase64(
      rgbPixels,
    );

  await RNFS.writeFile(
    path,
    base64,
    'base64',
  );

  console.log(
    '[LocalML] DEBUG crop saved:',
    path,
  );
}

async function clearClassifierDebugCrops(): Promise<void> {
  if (
    !DEBUG_SAVE_CLASSIFIER_CROPS
  ) {
    return;
  }

  const directory =
    `${RNFS.ExternalCachesDirectoryPath}/KrishiMandiAI_classifier_crops`;

  if (
    await RNFS.exists(directory)
  ) {
    await RNFS.unlink(directory);
  }

  await RNFS.mkdir(directory);

  console.log(
    '[LocalML] DEBUG crop directory:',
    directory,
  );
}

function classifyDetections(
  detections: LocalDetection[],
  image: Awaited<
    ReturnType<typeof loadImage>
  >,
  transform: {
    scale: number;
    offsetX: number;
    offsetY: number;
  },
  classifierInputName: string,
  classifierOutputName: string,
): Promise<LocalDetection[]> {
  if (!classifierSession) {
    throw new Error(
      'Local grain classifier session is not available.',
    );
  }

  return classifyDetectionsAsync(
    detections,
    image,
    transform,
    classifierInputName,
    classifierOutputName,
  );
}

async function classifyDetectionsAsync(
  detections: LocalDetection[],
  image: Awaited<
    ReturnType<typeof loadImage>
  >,
  transform: {
    scale: number;
    offsetX: number;
    offsetY: number;
  },
  classifierInputName: string,
  classifierOutputName: string,
): Promise<LocalDetection[]> {
  if (!classifierSession) {
    throw new Error(
      'Local grain classifier session is not available.',
    );
  }

  if (detections.length === 0) {
    return detections;
  }

  const raw =
    image.toRawPixelData();

  const pixels =
    new Uint8Array(
      raw.buffer,
    );

  console.log(
    '[LocalML] Classifying',
    detections.length,
    'grain crops...',
  );

  /*
   * IMPORTANT:
   *
   * YOLO is the authoritative detector/classifier
   * for the current pipeline.
   *
   * The MobileNet classifier is still executed
   * for debugging and future validation, but its
   * prediction MUST NOT replace the YOLO class.
   */

  for (
    let index = 0;
    index < detections.length;
    index += 1
  ) {
    const detection =
      detections[index];

    const classifierResult =
      createClassifierInput(
        pixels,
        raw.pixelFormat,
        image.width,
        image.height,
        detection,
        transform,
      );

    await saveClassifierCrop(
      classifierResult.rgbPixels,
      index,
    );

    const classifierTensor =
      new Tensor(
        'float32',
        classifierResult.inputData,
        [
          1,
          3,
          CLASSIFIER_IMAGE_SIZE,
          CLASSIFIER_IMAGE_SIZE,
        ],
      );

    const result =
      await classifierSession.run({
        [classifierInputName]:
          classifierTensor,
      });

    const output =
      result[
        classifierOutputName
      ] as Tensor;

    const logits =
      output.data as Float32Array;

    let maxLogit =
      Number.NEGATIVE_INFINITY;

    for (
      let classIndex = 0;
      classIndex <
      CLASSIFIER_CLASS_NAMES.length;
      classIndex += 1
    ) {
      if (
        logits[classIndex] >
        maxLogit
      ) {
        maxLogit =
          logits[classIndex];
      }
    }

    let probabilitySum = 0;

    const probabilities =
      new Float32Array(
        CLASSIFIER_CLASS_NAMES.length,
      );

    for (
      let classIndex = 0;
      classIndex <
      CLASSIFIER_CLASS_NAMES.length;
      classIndex += 1
    ) {
      const probability =
        Math.exp(
          logits[classIndex] -
            maxLogit,
        );

      probabilities[classIndex] =
        probability;

      probabilitySum +=
        probability;
    }

    let bestClassId = 0;
    let bestProbability = 0;

    for (
      let classIndex = 0;
      classIndex <
      CLASSIFIER_CLASS_NAMES.length;
      classIndex += 1
    ) {
      const probability =
        probabilities[classIndex] /
        probabilitySum;

      if (
        probability >
        bestProbability
      ) {
        bestProbability =
          probability;

        bestClassId =
          classIndex;
      }
    }

    const classifierClassName =
      CLASSIFIER_CLASS_NAMES[
        bestClassId
      ];

    const normalizedClassifierClassName =
      classifierClassName ===
      'Organic_Foreign_Matters'
        ? 'Organic Foreign Matters'
        : classifierClassName;

    console.log(
      `[LocalML] Grain ${index + 1}/${detections.length}:`,
      'YOLO =',
      detection.className,
      `(${detection.confidence.toFixed(4)})`,
      '| Classifier =',
      normalizedClassifierClassName,
      `(${bestProbability.toFixed(4)})`,
    );
  }

  /*
   * Return the ORIGINAL YOLO detections unchanged.
   *
   * This is the critical fix.
   *
   * Previously MobileNet replaced:
   *   classId
   *   className
   *   confidence
   *
   * That caused correct YOLO Clean detections
   * to become Chalky / OFM on the Result screen.
   */
  return detections;
}

export async function analyzeLocalImage(
  imagePath: string,
): Promise<LocalDetection[]> {
  if (
    !session ||
    !classifierSession
  ) {
    await loadLocalMlModel();
  }

  if (!session) {
    throw new Error(
      'Local YOLO ML session is not available.',
    );
  }

  if (!classifierSession) {
    throw new Error(
      'Local grain classifier session is not available.',
    );
  }

  const normalizedPath =
    imagePath.startsWith('file://')
      ? imagePath.substring(7)
      : imagePath;

  console.log(
    '[LocalML] Loading analysis image...',
  );

  const image =
    await loadImage({
      filePath: normalizedPath,
    });

  console.log(
    '[LocalML] Analysis image:',
    image.width,
    'x',
    image.height,
  );

  const inputData =
    createLetterboxedInput(
      image,
    );

  const inputTensor =
    new Tensor(
      'float32',
      inputData,
      [
        1,
        3,
        IMAGE_SIZE,
        IMAGE_SIZE,
      ],
    );

  const inputName =
    session.inputNames[0];

  const outputName =
    session.outputNames[0];

  console.log(
    '[LocalML] Running YOLO inference...',
  );

  const results =
    await session.run({
      [inputName]:
        inputTensor,
    });

  const output =
    results[
      outputName
    ] as Tensor;

  console.log(
    '[LocalML] YOLO output shape:',
    output.dims,
  );

  const detections =
    parseYoloOutput(output);

  console.log(
    '[LocalML] YOLO detections:',
    detections.length,
  );

  console.log(
    '[LocalML] YOLO RAW:',
    detections
      .map(
        (d, i) =>
          `${i + 1}:${d.className}(${d.confidence.toFixed(3)})`,
      )
      .join(' | '),
  );

  console.log(
    '[LocalML] YOLO raw classes:',
    detections
      .map(
        (d, i) =>
          `${i + 1}:${d.className}(${d.confidence.toFixed(3)})`,
      )
      .join(' | '),
  );

  if (detections.length === 0) {
    return detections;
  }

  const transform =
    getLetterboxTransform(
      image.width,
      image.height,
    );

  const classifierInputName =
    classifierSession.inputNames[0];

  const classifierOutputName =
    classifierSession.outputNames[0];

  await clearClassifierDebugCrops();

  const classifiedDetections =
    await classifyDetections(
      detections,
      image,
      transform,
      classifierInputName,
      classifierOutputName,
    );

  console.log(
    '[LocalML] Final detections:',
    classifiedDetections.length,
  );

  console.log(
    '[LocalML] Final YOLO classes:',
    classifiedDetections
      .map(
        (d, i) =>
          `${i + 1}:${d.className}(${d.confidence.toFixed(3)})`,
      )
      .join(' | '),
  );

  if (
    DEBUG_SAVE_CLASSIFIER_CROPS
  ) {
    console.log(
      '[LocalML] DEBUG: classifier crops are saved in:',
      `${RNFS.ExternalCachesDirectoryPath}/KrishiMandiAI_classifier_crops`,
    );
  }

  return classifiedDetections;
}

export function isLocalMlLoaded(): boolean {
  return (
    session !== null &&
    classifierSession !== null
  );
}

