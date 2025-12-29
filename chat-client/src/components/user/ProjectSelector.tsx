import { useChatStore } from '../../store/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';

export function ProjectSelector() {
    const { projects, selectedProjectId, setSelectedProject } = useChatStore();
    const { loadProjectUsers } = useWebSocket();

    const handleProjectChange = (projectId: string) => {
        if (projectId) {
            setSelectedProject(projectId);
            loadProjectUsers(projectId);
        } else {
            setSelectedProject(null);
        }
    };

    return (
        <div className="px-4 py-3.5 border-b border-gray-200 bg-white">
            <select
                value={selectedProjectId || ''}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                        {project.title} ({project.status})
                    </option>
                ))}
            </select>
        </div>
    );
}
