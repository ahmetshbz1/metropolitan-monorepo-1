const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Extract mermaid diagrams from architecture-diagram.md
const architectureFile = fs.readFileSync('architecture-diagram.md', 'utf8');
const mermaidBlocks = [];

// Find all mermaid code blocks
const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
let match;
let diagramIndex = 1;

while ((match = mermaidRegex.exec(architectureFile)) !== null) {
    const diagramContent = match[1];
    
    // Determine diagram name based on content
    let diagramName = `diagram-${diagramIndex}`;
    
    if (diagramContent.includes('Client Layer')) {
        diagramName = 'system-architecture';
    } else if (diagramContent.includes('Domain Etkileşim')) {
        diagramName = 'domain-interaction';
    } else if (diagramContent.includes('sequenceDiagram')) {
        diagramName = 'data-flow';
    } else if (diagramContent.includes('Security Layers')) {
        diagramName = 'security-architecture';
    } else if (diagramContent.includes('Production Environment')) {
        diagramName = 'deployment-architecture';
    } else if (diagramContent.includes('Caching Strategy')) {
        diagramName = 'performance-architecture';
    }
    
    mermaidBlocks.push({
        name: diagramName,
        content: diagramContent
    });
    diagramIndex++;
}

// Generate PNG files for each diagram
mermaidBlocks.forEach(diagram => {
    const tempMmdFile = `temp-${diagram.name}.mmd`;
    const outputFile = `images/${diagram.name}.png`;
    
    console.log(`🎨 Generating ${outputFile}...`);
    
    try {
        // Write temporary mermaid file
        fs.writeFileSync(tempMmdFile, diagram.content);
        
        // Generate PNG with high quality settings
        execSync(`mmdc -i ${tempMmdFile} -o ${outputFile} -w 1920 -H 1080 -s 2 -b white --configFile mermaid.config.json`, {
            stdio: 'inherit'
        });
        
        // Clean up temporary file
        fs.unlinkSync(tempMmdFile);
        
        console.log(`✅ Generated ${outputFile}`);
    } catch (error) {
        console.error(`❌ Error generating ${outputFile}:`, error.message);
    }
});

console.log('🎉 All diagrams generated successfully!');