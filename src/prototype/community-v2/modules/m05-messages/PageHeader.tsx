import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { paths } from "./lib";

export function PageHeader({ title, body, back = paths.inbox, action }: {
  title: string; body?: string; back?: string; action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start gap-2 lg:mb-6">
      <Link to={back} aria-label="Quay lại" className={[
        "grid size-11 shrink-0 place-items-center rounded-full text-nexoraMuted",
        "hover:bg-nexoraSurfaceMuted",
      ].join(" ")}>
        <ArrowLeft size={20} />
      </Link>
      <div className="min-w-0 flex-1 pt-1.5">
        <h2 className="text-xl font-bold lg:text-2xl">{title}</h2>
        {body && <p className="mt-1 text-sm text-nexoraMuted">{body}</p>}
      </div>
      {action}
    </div>
  );
}
