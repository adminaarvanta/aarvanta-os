/**
 * pdfjs-dist (via pdf-parse v2) constructs `DOMMatrix` while the module
 * evaluates. Node/Next.js have no browser canvas APIs. We intentionally do
 * **not** ship `@napi-rs/canvas` (or import `pdf-parse/worker`, which hard-
 * requires it) — native canvas breaks / bloats Vercel serverless traces.
 * A 2D matrix + stubs is enough for text extraction.
 */

type Matrix2D = { a: number; b: number; c: number; d: number; e: number; f: number };

class NodeDOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  m11 = 1;
  m12 = 0;
  m13 = 0;
  m14 = 0;
  m21 = 0;
  m22 = 1;
  m23 = 0;
  m24 = 0;
  m31 = 0;
  m32 = 0;
  m33 = 1;
  m34 = 0;
  m41 = 0;
  m42 = 0;
  m43 = 0;
  m44 = 1;
  is2D = true;
  isIdentity = true;

  constructor(init?: number[] | Float32Array | Float64Array | string | Matrix2D) {
    if (!init) return;
    if (typeof init === "string") {
      this.#fromCss(init);
      return;
    }
    if (ArrayBuffer.isView(init) || Array.isArray(init)) {
      const values = Array.from(init);
      if (values.length >= 6) {
        this.#set2D(values[0], values[1], values[2], values[3], values[4], values[5]);
      }
      return;
    }
    this.#set2D(init.a, init.b, init.c, init.d, init.e, init.f);
  }

  #set2D(a: number, b: number, c: number, d: number, e: number, f: number) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    this.m11 = a;
    this.m12 = b;
    this.m21 = c;
    this.m22 = d;
    this.m41 = e;
    this.m42 = f;
    this.isIdentity = a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0;
  }

  #fromCss(source: string) {
    const matrix = source.match(
      /matrix\(\s*([^)]+)\)/i
    );
    if (!matrix) return;
    const values = matrix[1].split(/[\s,]+/).map(Number);
    if (values.length >= 6 && values.every((n) => Number.isFinite(n))) {
      this.#set2D(values[0], values[1], values[2], values[3], values[4], values[5]);
    }
  }

  #clone() {
    return new NodeDOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]);
  }

  multiplySelf(other: Matrix2D) {
    const a = this.a * other.a + this.c * other.b;
    const b = this.b * other.a + this.d * other.b;
    const c = this.a * other.c + this.c * other.d;
    const d = this.b * other.c + this.d * other.d;
    const e = this.a * other.e + this.c * other.f + this.e;
    const f = this.b * other.e + this.d * other.f + this.f;
    this.#set2D(a, b, c, d, e, f);
    return this;
  }

  preMultiplySelf(other: Matrix2D) {
    const applied = new NodeDOMMatrix([other.a, other.b, other.c, other.d, other.e, other.f]);
    applied.multiplySelf(this);
    this.#set2D(applied.a, applied.b, applied.c, applied.d, applied.e, applied.f);
    return this;
  }

  translateSelf(tx = 0, ty = 0) {
    return this.multiplySelf({ a: 1, b: 0, c: 0, d: 1, e: tx, f: ty });
  }

  scaleSelf(sx = 1, sy = sx) {
    return this.multiplySelf({ a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 });
  }

  invertSelf() {
    const det = this.a * this.d - this.b * this.c;
    if (!det) {
      this.#set2D(NaN, NaN, NaN, NaN, NaN, NaN);
      this.isIdentity = false;
      return this;
    }
    const { a, b, c, d, e, f } = this;
    this.#set2D(
      d / det,
      -b / det,
      -c / det,
      a / det,
      (c * f - d * e) / det,
      (b * e - a * f) / det
    );
    return this;
  }

  translate(tx = 0, ty = 0) {
    return this.#clone().translateSelf(tx, ty);
  }

  scale(sx = 1, sy = sx) {
    return this.#clone().scaleSelf(sx, sy);
  }

  multiply(other: Matrix2D) {
    return this.#clone().multiplySelf(other);
  }

  inverse() {
    return this.#clone().invertSelf();
  }
}

class NodePath2D {
  constructor(_path?: string | NodePath2D) {}
  addPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  bezierCurveTo() {}
  quadraticCurveTo() {}
  arc() {}
  arcTo() {}
  ellipse() {}
  rect() {}
  roundRect() {}
}

class NodeImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace = "srgb";

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

export function ensurePdfDomPolyfills() {
  const globals = globalThis as unknown as {
    DOMMatrix?: unknown;
    Path2D?: unknown;
    ImageData?: unknown;
  };
  globals.DOMMatrix ??= NodeDOMMatrix;
  globals.Path2D ??= NodePath2D;
  globals.ImageData ??= NodeImageData;
}

ensurePdfDomPolyfills();
