import Papa from 'papaparse';
import { Template, TimeBlock, Category } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface TemplateCSVRow {
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  description?: string;
}

/**
 * Export a template to CSV format
 */
export function exportTemplateToCSV(template: Template, categories: Category[]): string {
  const rows: TemplateCSVRow[] = template.blocks.map(block => {
    const category = categories.find(cat => cat.id === block.categoryId);
    return {
      title: block.title,
      category: category?.name || 'Unknown',
      startTime: block.startTime,
      endTime: block.endTime,
      description: block.description || ''
    };
  });

  return Papa.unparse(rows, {
    quotes: true,
    header: true
  });
}

/**
 * Download a CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV file and create a template
 */
export function importTemplateFromCSV(
  csvContent: string,
  templateName: string,
  categories: Category[]
): { template: Template | null; errors: string[] } {
  const errors: string[] = [];
  
  const result = Papa.parse<TemplateCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim()
  });

  if (result.errors.length > 0) {
    result.errors.forEach(err => {
      errors.push(`Row ${err.row}: ${err.message}`);
    });
  }

  if (result.data.length === 0) {
    errors.push('CSV file is empty or invalid');
    return { template: null, errors };
  }

  // Validate and convert rows to TimeBlocks
  const blocks: TimeBlock[] = [];
  
  result.data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because of header and 1-indexed

    // Validate required fields
    if (!row.title || !row.category || !row.startTime || !row.endTime) {
      errors.push(`Row ${rowNum}: Missing required fields (title, category, startTime, or endTime)`);
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(row.startTime)) {
      errors.push(`Row ${rowNum}: Invalid startTime format "${row.startTime}" (expected HH:MM)`);
      return;
    }
    if (!timeRegex.test(row.endTime)) {
      errors.push(`Row ${rowNum}: Invalid endTime format "${row.endTime}" (expected HH:MM)`);
      return;
    }

    // Find category
    const category = categories.find(cat => 
      cat.name.toLowerCase() === row.category.toLowerCase()
    );
    
    if (!category) {
      errors.push(`Row ${rowNum}: Category "${row.category}" not found. Available categories: ${categories.map(c => c.name).join(', ')}`);
      return;
    }

    // Create TimeBlock
    blocks.push({
      id: uuidv4(),
      title: row.title.trim(),
      categoryId: category.id,
      startTime: row.startTime.trim(),
      endTime: row.endTime.trim(),
      description: row.description?.trim() || undefined
    });
  });

  // If there are validation errors, don't create the template
  if (errors.length > 0) {
    return { template: null, errors };
  }

  // Create the template
  const template: Template = {
    id: uuidv4(),
    name: templateName,
    blocks,
    isDefault: false
  };

  return { template, errors: [] };
}

/**
 * Read a file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}
