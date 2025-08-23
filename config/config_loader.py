# config/config_loader.py
import os
import yaml
from typing import Dict, Any, Optional
from crewai import Agent, Task
from pathlib import Path

class ConfigLoader:
    """
    Handles loading and processing of YAML configuration files for agents and tasks.
    """
    def __init__(self, config_dir: str = "config"):
        self.config_dir = Path(config_dir)
        self.agents_config = self._load_yaml("agents.yaml")
        self.tasks_config = self._load_yaml("tasks.yaml")
        self.tools = None

    def _load_yaml(self, filename: str) -> Dict[str, Any]:
        """Load a YAML file from the config directory."""
        try:
            with open(self.config_dir / filename, 'r') as file:
                return yaml.safe_load(file)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return {}

    def set_tools(self, tools: Dict[str, Any]) -> None:
        """Set the tools available for agents."""
        self.tools = tools

    def create_agent(self, agent_name: str) -> Optional[Agent]:
        """Create an agent from configuration."""
        if agent_name not in self.agents_config:
            print(f"Agent configuration not found for: {agent_name}")
            return None

        config = self.agents_config[agent_name]
        
        # Get the tools specified for this agent
        agent_tools = []
        if self.tools:
            agent_tools = [self.tools[tool] for tool in config.get('tools', [])
                         if tool in self.tools]

        return Agent(
            role=config['role'],
            goal=config['goal'],
            backstory=config['backstory'],
            verbose=config.get('verbose', True),
            allow_delegation=config.get('allow_delegation', False),
            max_iter=config.get('max_iter', 1),
            tools=agent_tools
        )

    def create_task(self, task_name: str, agent: Agent, 
                    context: Dict[str, Any] = None) -> Optional[Task]:
        """Create a task from configuration with context substitution."""
        if 'tasks' not in self.tasks_config or task_name not in self.tasks_config['tasks']:
            print(f"Task configuration not found for: {task_name}")
            return None

        config = self.tasks_config['tasks'][task_name]
        
        # Format description and expected output with context if provided
        description = config['description']
        expected_output = config['expected_output']
        if context:
            description = description.format(**context)
            expected_output = expected_output.format(**context)

        # Get the tools specified for this task
        task_tools = []
        if self.tools and 'tools' in config:
            for tool_name in config['tools']:
                if tool_name in self.tools and self.tools[tool_name] is not None:
                    task_tools.append(self.tools[tool_name])

        # Create task with or without tools
        task_params = {
            'description': description,
            'expected_output': expected_output,
            'agent': agent
        }
        
        # Only add tools if we have valid tools
        if task_tools:
            task_params['tools'] = task_tools

        return Task(**task_params)