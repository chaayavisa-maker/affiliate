import ToolsClient from './ToolsClient';
import toolsData from '../../../data/tools.json';

export default function ToolsPage() {
  return <ToolsClient tools={toolsData} />;
}
