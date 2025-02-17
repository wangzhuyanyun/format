import path from 'path';
import * as fs from 'fs/promises';

export async function updateItemsWithFormulas(templateItems, formulasData,outputPath) {
  const updatedItems = templateItems.map((item: any) => {
    const normalizedCsiSection = item.csiSection.replace(/\s+/g, ''); // 去除空格
    let formulasItem = formulasData.find(
      (f) => f.csiSection.replace(/\s+/g, '') === normalizedCsiSection
    );
    
    if (!formulasItem) {
      formulasItem = formulasData.find(
        (f) => f.csiSection.replace(/\s+/g, '').startsWith(normalizedCsiSection.substring(0, 4))
      );
    }

    return {
      ...item,
      tradeType: formulasItem?.tradeType || '',
      unit: formulasItem?.unit || '',
      formulas: formulasItem?.formulas || {},
    };
  });

  await fs.writeFile(path.join(__dirname, '../data2.5/new-template-items.json'), JSON.stringify(updatedItems, null, 2));
  return updatedItems;
}
