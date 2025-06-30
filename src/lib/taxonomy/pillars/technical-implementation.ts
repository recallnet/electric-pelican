/**
 * @file Technical Implementation taxonomy pillar
 * @description L1, L2, and L3 tags for technical implementation capabilities
 */

import type { TaxonomyTag } from "@/types/taxonomy";

export const technicalImplementationPillar: TaxonomyTag[] = [
  // L1: Core Pillar
  {
    id: "technical-implementation",
    name: "Technical Implementation",
    description: "Code generation, system design, and technical execution capabilities",
  },

  // L2: Families
  {
    id: "code-generation",
    name: "Code Generation",
    description: "Writing and generating functional code",
    parentId: "technical-implementation",
  },
  {
    id: "system-design",
    name: "System Design",
    description: "Designing and architecting technical systems",
    parentId: "technical-implementation",
  },
  {
    id: "debugging-optimization",
    name: "Debugging & Optimization",
    description: "Finding and fixing issues, optimizing performance",
    parentId: "technical-implementation",
  },
  {
    id: "devops-deployment",
    name: "DevOps & Deployment",
    description: "Deployment, infrastructure, and operational concerns",
    parentId: "technical-implementation",
  },
  {
    id: "data-engineering",
    name: "Data Engineering",
    description: "Working with data pipelines, databases, and data processing",
    parentId: "technical-implementation",
  },

  // L3: Code Generation Leaves
  {
    id: "algorithm-implementation",
    name: "Algorithm Implementation",
    description: "Implementing algorithms and data structures",
    parentId: "code-generation",
  },
  {
    id: "api-development",
    name: "API Development",
    description: "Creating APIs and web services",
    parentId: "code-generation",
  },
  {
    id: "frontend-development",
    name: "Frontend Development",
    description: "Building user interfaces and frontend applications",
    parentId: "code-generation",
  },
  {
    id: "backend-development",
    name: "Backend Development",
    description: "Building server-side applications and services",
    parentId: "code-generation",
  },
  {
    id: "test-automation",
    name: "Test Automation",
    description: "Writing automated tests and testing frameworks",
    parentId: "code-generation",
  },

  // L3: System Design Leaves
  {
    id: "architecture-design",
    name: "Architecture Design",
    description: "Designing software and system architectures",
    parentId: "system-design",
  },
  {
    id: "database-design",
    name: "Database Design",
    description: "Designing database schemas and data models",
    parentId: "system-design",
  },
  {
    id: "scalability-planning",
    name: "Scalability Planning",
    description: "Planning for system scalability and growth",
    parentId: "system-design",
  },
  {
    id: "security-design",
    name: "Security Design",
    description: "Incorporating security considerations into design",
    parentId: "system-design",
  },

  // L3: Debugging & Optimization Leaves
  {
    id: "error-diagnosis",
    name: "Error Diagnosis",
    description: "Identifying and diagnosing errors and bugs",
    parentId: "debugging-optimization",
  },
  {
    id: "performance-optimization",
    name: "Performance Optimization",
    description: "Optimizing code and system performance",
    parentId: "debugging-optimization",
  },
  {
    id: "code-refactoring",
    name: "Code Refactoring",
    description: "Improving code structure and maintainability",
    parentId: "debugging-optimization",
  },
  {
    id: "profiling-analysis",
    name: "Profiling Analysis",
    description: "Analyzing system performance and resource usage",
    parentId: "debugging-optimization",
  },

  // L3: DevOps & Deployment Leaves
  {
    id: "ci-cd-implementation",
    name: "CI CD Implementation",
    description: "Setting up continuous integration and deployment",
    parentId: "devops-deployment",
  },
  {
    id: "infrastructure-management",
    name: "Infrastructure Management",
    description: "Managing cloud and infrastructure resources",
    parentId: "devops-deployment",
  },
  {
    id: "monitoring-logging",
    name: "Monitoring Logging",
    description: "Setting up monitoring and logging systems",
    parentId: "devops-deployment",
  },
  {
    id: "containerization",
    name: "Containerization",
    description: "Working with containers and orchestration",
    parentId: "devops-deployment",
  },

  // L3: Data Engineering Leaves
  {
    id: "data-pipeline-design",
    name: "Data Pipeline Design",
    description: "Designing and implementing data processing pipelines",
    parentId: "data-engineering",
  },
  {
    id: "etl-implementation",
    name: "ETL Implementation",
    description: "Implementing extract, transform, load processes",
    parentId: "data-engineering",
  },
  {
    id: "data-modeling",
    name: "Data Modeling",
    description: "Creating data models and schemas",
    parentId: "data-engineering",
  },
  {
    id: "big-data-processing",
    name: "Big Data Processing",
    description: "Working with large-scale data processing systems",
    parentId: "data-engineering",
  },
];
