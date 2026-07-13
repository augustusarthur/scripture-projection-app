import Image from "next/image";

type ProfilePhotoProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export function ProfilePhoto({
  src,
  alt,
  width,
  height,
  className,
}: ProfilePhotoProps) {
  const isBlob = src.includes("blob.vercel-storage.com");

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized={isBlob || src.startsWith("blob:")}
    />
  );
}
