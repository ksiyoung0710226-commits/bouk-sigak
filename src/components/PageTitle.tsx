export default function PageTitle({
  title,
  desc,
}: {
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      {desc && <p className="mt-2 text-foreground/70">{desc}</p>}
    </div>
  );
}
