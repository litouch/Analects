// sync_notion_to_supabase.js

import fetch from "node-fetch";

// -------------------🔧 配置区域 -------------------
const NOTION_DATABASE_ID = "1dc198d083bc80fcbfc0c24eb6f862cc";
const NOTION_API_KEY = "ntn_J6858769340aiSeYfQG0VxfWv3qF4fcMD53hC1DIIe3f2w";
const SUPABASE_PROJECT_URL = "https://btqbtibvevglwcpiewyu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0cWJ0aWJ2ZXZnbHdjcGlld3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNjQ1OTIsImV4cCI6MjA2OTk0MDU5Mn0.2xP2sqHBdFyO1phAYsO96YEVo-qBXVrXqv1k0ct7-7Q";
// --------------------------------------------------

// 获取 Notion 数据库 schema
async function getNotionPropertyOptions() {
  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`❌ Failed to fetch Notion DB schema: ${errorText}`);
  }

  const data = await res.json();

  const peopleField = data.properties["人物"];
  if (!peopleField || !peopleField.multi_select) {
    throw new Error("⚠️ '人物' 字段不是 multi_select 类型，或者未找到该字段。");
  }

  const options = peopleField.multi_select.options.map(opt => opt.name);
  return options;
}

// 写入 Supabase
async function insertCharacterToSupabase(name) {
  const res = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/characters`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    },
    body: JSON.stringify([{ name }])
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`❌ Failed to insert '${name}': ${err}`);
  }
}

(async () => {
  try {
    console.log("🚀 正在从 Notion 获取 '人物' 字段的所有选项...");
    const options = await getNotionPropertyOptions();
    console.log(`✅ 获取到 ${options.length} 个人物选项:`, options);

    for (const name of options) {
      console.log(`➡️ 正在写入 Supabase: ${name}`);
      await insertCharacterToSupabase(name);
    }

    console.log("🎉 所有人物名称已成功同步到 Supabase！");
  } catch (err) {
    console.error(err.message);
  }
})();
