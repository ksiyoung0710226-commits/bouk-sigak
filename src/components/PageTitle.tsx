export default function PageTitle({
  title,
  desc,
}: {
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="sticker text-4xl sm:text-5xl">{title}</h1>
      {desc && <p className="mt-3 max-w-2xl text-foreground/80">{desc}</p>}
    </div>
  );
}
