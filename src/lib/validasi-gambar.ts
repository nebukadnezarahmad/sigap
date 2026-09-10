const UKURAN_MAKSIMAL = 5 * 1024 * 1024;
const JENIS_DIIJINKAN = new Set(["image/jpeg", "image/png", "image/webp"]);
const EKSTENSI_DIIJINKAN = new Set(["jpg", "jpeg", "png", "webp"]);

export const ACCEPT_GAMBAR = "image/jpeg,image/png,image/webp";

function cocokDenganSignature(jenis: string, byte: Uint8Array) {
  if (jenis === "image/jpeg") {
    return byte[0] === 0xff && byte[1] === 0xd8 && byte[2] === 0xff;
  }
  if (jenis === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (nilai, indeks) => byte[indeks] === nilai
    );
  }
  if (jenis === "image/webp") {
    return (
      String.fromCharCode(...byte.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...byte.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

function bacaSignature(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const pembaca = new FileReader();
    pembaca.onload = () => resolve(new Uint8Array(pembaca.result as ArrayBuffer));
    pembaca.onerror = () => reject(new Error("Foto tidak dapat dibaca."));
    pembaca.readAsArrayBuffer(file.slice(0, 12));
  });
}

async function gambarDapatDidekode(file: File) {
  if (typeof createImageBitmap === "function") {
    try {
      const gambar = await createImageBitmap(file);
      const valid = gambar.width > 0 && gambar.height > 0;
      gambar.close();
      return valid;
    } catch {
      return false;
    }
  }

  return new Promise<boolean>((resolve) => {
    const url = URL.createObjectURL(file);
    const gambar = new Image();
    gambar.onload = () => {
      URL.revokeObjectURL(url);
      resolve(gambar.naturalWidth > 0 && gambar.naturalHeight > 0);
    };
    gambar.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    gambar.src = url;
  });
}

export async function pesanValidasiGambar(file: File): Promise<string | null> {
  if (file.size > UKURAN_MAKSIMAL) {
    return "Ukuran foto maksimal 5 MB. Pilih foto lebih kecil lalu coba lagi.";
  }

  const ekstensi = file.name.toLowerCase().split(".").pop();
  if (
    !JENIS_DIIJINKAN.has(file.type.toLowerCase()) ||
    !ekstensi ||
    !EKSTENSI_DIIJINKAN.has(ekstensi)
  ) {
    return "Format foto harus JPEG, PNG, atau WebP.";
  }

  const signature = await bacaSignature(file);
  if (!cocokDenganSignature(file.type.toLowerCase(), signature)) {
    return "Isi berkas tidak cocok dengan format foto yang dipilih.";
  }
  if (!(await gambarDapatDidekode(file))) {
    return "Foto rusak atau tidak dapat dibaca.";
  }

  return null;
}
