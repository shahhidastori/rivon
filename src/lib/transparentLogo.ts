function loadLocalImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the selected logo image."));
    };
    image.src = url;
  });
}

function drawToCanvas(image: HTMLImageElement) {
  const maxSide = 2400;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image processing is not supported in this browser.");

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

function hasTransparentEdge(imageData: ImageData, width: number, height: number) {
  const { data } = imageData;
  let transparentEdgePixels = 0;
  let edgePixels = 0;

  const countPixel = (x: number, y: number) => {
    edgePixels += 1;
    if (data[(y * width + x) * 4 + 3] < 245) {
      transparentEdgePixels += 1;
    }
  };

  for (let x = 0; x < width; x += 1) {
    countPixel(x, 0);
    countPixel(x, height - 1);
  }

  for (let y = 1; y < height - 1; y += 1) {
    countPixel(0, y);
    countPixel(width - 1, y);
  }

  return edgePixels > 0 && transparentEdgePixels / edgePixels > 0.2;
}

function isNeutralBackgroundPixel(red: number, green: number, blue: number, alpha: number) {
  if (alpha < 245) return true;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const neutralSpread = max - min;
  const warmLogoPixel = red > blue + 14 && green > blue + 8 && red >= green - 34;
  const neutralPixel = neutralSpread <= 18;
  const nearWhite = red > 235 && green > 235 && blue > 235 && neutralSpread <= 28;
  const nearBlack = red < 34 && green < 34 && blue < 34;

  return !warmLogoPixel && (neutralPixel || nearWhite || nearBlack);
}

function isWarmLogoPixel(red: number, green: number, blue: number) {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  return max - min > 24 && red > blue + 16 && green > blue + 8 && red >= green - 42;
}

function hasWarmLogoNeighbor(data: Uint8ClampedArray, width: number, height: number, x: number, y: number) {
  let warmNeighbors = 0;

  for (let nextY = Math.max(0, y - 5); nextY <= Math.min(height - 1, y + 5); nextY += 1) {
    for (let nextX = Math.max(0, x - 5); nextX <= Math.min(width - 1, x + 5); nextX += 1) {
      const index = (nextY * width + nextX) * 4;
      if (data[index + 3] > 8 && isWarmLogoPixel(data[index], data[index + 1], data[index + 2])) {
        warmNeighbors += 1;
      }
    }
  }

  return warmNeighbors >= 1;
}

function shouldPreserveHighlight(data: Uint8ClampedArray, width: number, height: number, x: number, y: number) {
  const index = (y * width + x) * 4;
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  const brightHighlight = red > 232 && green > 222 && blue > 170;

  return brightHighlight && hasWarmLogoNeighbor(data, width, height, x, y);
}

function removeNeutralBackground(imageData: ImageData) {
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    const pixel = index / 4;
    const x = pixel % imageData.width;
    const y = Math.floor(pixel / imageData.width);

    if (isNeutralBackgroundPixel(red, green, blue, alpha) && !shouldPreserveHighlight(data, imageData.width, imageData.height, x, y)) {
      data[index + 3] = 0;
    }
  }
}

function cropTransparentPixels(source: HTMLCanvasElement) {
  const context = source.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image processing is not supported in this browser.");

  const imageData = context.getImageData(0, 0, source.width, source.height);
  const { data } = imageData;
  let minX = source.width;
  let minY = source.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const alpha = data[(y * source.width + x) * 4 + 3];
      if (alpha > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX > maxX || minY > maxY) return source;

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const padding = Math.round(Math.max(width, height) * 0.1);
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(source.width - cropX, width + padding * 2);
  const cropHeight = Math.min(source.height - cropY, height + padding * 2);
  const squareSize = Math.max(cropWidth, cropHeight);
  const output = document.createElement("canvas");
  output.width = squareSize;
  output.height = squareSize;

  const outputContext = output.getContext("2d");
  if (!outputContext) throw new Error("Image processing is not supported in this browser.");

  outputContext.drawImage(
    source,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    Math.round((squareSize - cropWidth) / 2),
    Math.round((squareSize - cropHeight) / 2),
    cropWidth,
    cropHeight
  );

  return output;
}

function canvasToPngFile(canvas: HTMLCanvasElement, originalFile: File) {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not prepare the logo image."));
        return;
      }

      const baseName = originalFile.name.replace(/\.[^.]+$/, "") || "brand-logo";
      resolve(new File([blob], `${baseName}-transparent.png`, { type: "image/png" }));
    }, "image/png");
  });
}

export async function prepareTransparentLogo(file: File) {
  const image = await loadLocalImage(file);
  const { canvas, context } = drawToCanvas(image);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  if (hasTransparentEdge(imageData, canvas.width, canvas.height)) {
    return file;
  }

  removeNeutralBackground(imageData);
  context.putImageData(imageData, 0, 0);
  return canvasToPngFile(cropTransparentPixels(canvas), file);
}
