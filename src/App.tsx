import { EditorPage } from './features/editor/EditorPage';
import { DesignListPage } from './pages/DesignListPage';

const App = () => (
  <div className="min-h-screen bg-slate-950 pb-16 pt-10 text-slate-50">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6">
      <DesignListPage />
      <EditorPage />
    </div>
  </div>
);

export default App;
