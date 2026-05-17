import ToolsClient from './ToolsClient';
import toolsData from '../../public/tools.json';

export default function ToolsPage() {
  return <ToolsClient tools={toolsData} />;
}
