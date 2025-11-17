import { DesignList } from '../../features/designs/ui/DesignList';
import { EditorLayout } from '../../features/editor/ui/EditorLayout';

export const WorkspacePage = () => (
  <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6">
    <DesignList />
    <EditorLayout />
  </div>
);

