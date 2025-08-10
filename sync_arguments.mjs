import fetch from 'node-fetch';

// -------------------🔧 配置区域 -------------------
const NOTION_DATABASE_ID = "1dc198d083bc80fcbfc0c24eb6f862cc";
const NOTION_API_KEY = "ntn_J6858769340aiSeYfQG0VxfWv3qF4fcMD53hC1DIIe3f2w";
const SUPABASE_URL = "https://btqbtibvevglwcpiewyu.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0cWJ0aWJ2ZXZnbHdjcGlld3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNjQ1OTIsImV4cCI6MjA2OTk0MDU5Mn0.2xP2sqHBdFyO1phAYsO96YEVo-qBXVrXqv1k0ct7-7Q";
// --------------------------------------------------

// 获取 Notion 数据库属性定义
async function getNotionSelectOptions() {
  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  });

  const data = await res.json();

  const argumentProperty = Object.entries(data.properties).find(
    ([, prop]) => prop.type === 'multi_select' && prop.name === '论点'
  );

  if (!argumentProperty) {
    console.error('❌ 没有找到名为“论点”的 multi_select 字段');
    return [];
  }

  const [, propertyConfig] = argumentProperty;
  const options = propertyConfig.multi_select.options.map(opt => opt.name);
  return options;
}

// 插入到 Supabase 的 arguments 表
async function insertIntoSupabase(titles) {
  for (const title of titles) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/arguments`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_API_KEY,
        'Authorization': `Bearer ${SUPABASE_API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates' // 避免重复插入
      },
      body: JSON.stringify([{ title }])
    });

    // 🔧 修复点：处理空响应体
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = null; // 忽略空响应体
    }

    if (res.ok) {
      console.log(`✅ 插入成功: ${title}`);
    } else {
      console.error(`❌ 插入失败 '${title}':`, {
        status: res.status,
        statusText: res.statusText,
        body: data,
      });
    }
  }
}


async function main() {
  const options = await getNotionSelectOptions();
  if (options.length === 0) {
    console.log('⚠️ 没有找到任何 option');
    return;
  }
  console.log(`➡️ 准备插入 ${options.length} 条论点：`, options);
  await insertIntoSupabase(options);
}

main();
