import axios from 'axios';

// 从环境变量获取配置
const apiKey = import.meta.env.VITE_AI_API_KEY;
let baseUrl = import.meta.env.VITE_AI_BASE_URL;

// 格式化 API 地址，确保以 /v1 结尾
if (baseUrl && !baseUrl.endsWith('/v1')) {
  baseUrl = baseUrl.replace(/\/$/, '') + '/v1';
}

/**
 * 获取搜索建议
 * @param {String} query - 用户搜索的查询词
 * @param {Number} retryCount - 当前重试次数
 */
export async function getSearchSuggestions(query, retryCount = 0) {
  const prompt = `请根据用户的搜索查询"${query}"提供5个相关的心理学概念建议。
  
  【严格限制】：
  - 每个建议必须是真实心理学文献中有记载的概念，可以是理论、现象、原理、模型、定律、悖论、假说、人格特质、心理障碍、治疗方法、评估工具等。
  - 每个建议不超过8个字。
  - 建议必须与用户的搜索查询"${query}"高度相关。
  - 建议要多样化，不要只局限于"效应"，可以包括人格类型、心理测试、治疗方法等。
  
  【输出要求】：
  只需输出一个JSON数组，包含5个建议：
  ["建议1", "建议2", "建议3", "建议4", "建议5"]`;

  try {
    const response = await axios.post(`${baseUrl}/chat/completions`, {
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "你是一个心理学专家，擅长提供相关的心理学概念建议。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const content = response.data.choices[0].message.content;
    const suggestions = JSON.parse(content);
    
    // 确保返回的是数组
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    console.error("获取搜索建议失败:", error);
    
    // 如果重试次数未达到上限，则重试
    if (retryCount < 1) {
      console.log(`获取搜索建议失败，正在重试... (${retryCount + 1}/2)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getSearchSuggestions(query, retryCount + 1);
    }
    
    // 如果重试次数达到上限，返回空数组
    return [];
  }
}

/**
 * 根据搜索查询生成心理学知识卡片
 * @param {String} query - 用户搜索的查询词
 * @param {Number} retryCount - 当前重试次数
 */
export async function getPsychologyCardFromSearch(query, retryCount = 0) {
  // 获取当前页面已有的内容，避免重复
  const archive = JSON.parse(localStorage.getItem('psych_archive') || '[]');
  const allTitles = archive.map(item => item.title);
  const blacklist = allTitles.length > 0 ? allTitles.join('、') : '无';
  
  // 首先检查搜索词是否与心理学相关
  const relevanceCheckPrompt = `请判断用户的搜索查询"${query}"是否与心理学相关。
  
  【输出要求】：
  只需输出一个JSON对象，包含以下字段：
  {
    "isRelevant": true/false, // 是否与心理学相关
    "reason": "判断理由，不超过50字"
  }`;

  try {
    // 先进行相关性检查
    const relevanceResponse = await axios.post(`${baseUrl}/chat/completions`, {
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "你是一个心理学专家，擅长判断搜索内容是否与心理学相关。请客观、准确地判断。" 
        },
        { role: "user", content: relevanceCheckPrompt }
      ],
      temperature: 0.3,
      max_tokens: 100,
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const relevanceResult = JSON.parse(relevanceResponse.data.choices[0].message.content);
    
    // 如果与心理学不相关，返回特殊标记
    if (!relevanceResult.isRelevant) {
      return {
        isNotRelevant: true,
        reason: relevanceResult.reason || "该搜索内容与心理学无关"
      };
    }

    // 如果与心理学相关，继续生成心理学知识卡片
    const prompt = `你是一个顶级的心理学策展人。请根据用户的搜索查询"${query}"生成一个相关的心理学知识条目。
    
    【严格限制】：
    - title (标题): 必须在 12 个字以内，极简且有力。标题必须是真实心理学文献中有记载的概念，可以是理论、现象、原理、模型、定律、悖论、假说、人格特质、心理障碍、治疗方法、评估工具等，不限于"效应"。
    - brief (概括): 必须在 30——100 个字以内，一句话勾起好奇心。
    - detail (解析): 请分为三点详细解析，每点之间使用 \\n 换行。
    - tag (标签): 一个词概括领域，如"社会心理学"、"人格心理学"、"临床心理学"、"认知心理学"等。
    - 严禁重复：绝对不要生成以下标题：${blacklist}。
    - 【高度相关性】：生成的内容必须与用户的搜索查询"${query}"高度相关，直接回应搜索意图。
    - 【学术真实性】：生成的标题必须是真实心理学文献中有记载的概念，包括但不限于理论、现象、原理、模型、定律、悖论、假说、人格特质、心理障碍、治疗方法、评估工具等，不限于"效应"。

    【内容要求】：
    - story (案例): 必须包含一个经典心理学实验或历史案例，和一个现代社会热点或有趣现象，每个案例不超过80字。案例要生动有趣，引人入胜。格式为："经典案例：[80字内]\n现代热点：[80字内]"
    - extraCase (趣味案例): 一个有趣的心理学现象或小知识，不超过80字，内容要轻松有趣，与日常生活相关。
    - usage (应用): 提供两个具体的现代生活场景应用，每个场景单独成段，如职场、社交媒体、教育等领域。应用要实用且贴近生活。格式为："现代应用1：[具体场景描述]\n现代应用2：[具体场景描述]"

    【输出要求】：
    必须输出纯 JSON 格式，包含以下字段：
    {
      "title": "标题",
      "tag": "领域标签",
      "brief": "核心概括",
      "detail": "深度解析内容",
      "story": "经典案例：[80字内]\n现代热点：[80字内]",
      "extraCase": "一个有趣的心理学现象或小知识，不超过80字",
      "usage": "现代应用1：[具体场景描述]\n现代应用2：[具体场景描述]",
      "similar": "一个相关的心理学关联词（只生成一个关联词即可）"
    }`;

    const response = await axios.post(`${baseUrl}/chat/completions`, {
      model: "deepseek-chat", // 或者你使用的其他模型名称
      messages: [
        { 
          role: "system", 
          content: "你是一个风趣幽默的心理学专家，擅长用生动有趣的方式解释心理学概念。请确保内容既有学术深度又有趣味性，案例要引人入胜，让读者在轻松愉快的氛围中学习心理学知识。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7, // 降低随机性，提高响应速度
      max_tokens: 800, // 减少最大令牌数，提高响应速度
      response_format: { type: 'json_object' } // 强制要求 JSON 输出
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时
    });

    // 解析并返回 AI 数据
    const content = response.data.choices[0].message.content;
    const cardData = JSON.parse(content);
    
    // 添加相关性检查结果
    return {
      ...cardData,
      isRelevant: true
    };
  } catch (error) {
    console.error("AI Service Error:", error);
    
    // 如果重试次数未达到上限，则重试
    if (retryCount < 2) {
      console.log(`请求失败，正在重试... (${retryCount + 1}/3)`);
      // 等待一段时间后重试，避免频繁请求
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return getPsychologyCardFromSearch(query, retryCount + 1);
    }
    
    // 如果重试次数达到上限，返回一个友好的错误占位卡片
    return {
      title: "搜索失败",
      tag: "系统提示",
      brief: "无法找到与搜索相关的心理学概念，请尝试其他关键词。",
      detail: "1. 请尝试使用更具体或不同的关键词。\\n2. 确保搜索内容与心理学相关。\\n3. 请稍后再试。",
      story: "搜索功能可以帮助你快速找到感兴趣的心理学知识。",
      usage: "请尝试搜索如'认知偏差'、'情绪调节'等关键词。",
      similar: "搜索技巧",
      isError: true
    };
  }
}

/**
 * 从 AI 获取心理学知识卡片
 * @param {Array} excludeTitles - 已存在的标题列表，用于防重复
 * @param {Number} totalCollected - 收藏夹已有的数量，用于调整内容难度
 * @param {Number} retryCount - 当前重试次数
 */
export async function getPsychologyCard(excludeTitles = [], totalCollected = 0, retryCount = 0) {
  // 1. 构建去重黑名单 - 包括当前卡片、收藏夹中的所有标题和关联词
  const archive = JSON.parse(localStorage.getItem('psych_archive') || '[]');
  const allTitles = [...excludeTitles, ...archive.map(item => item.title)];
  const allSimilarWords = archive.map(item => item.similar).filter(Boolean);
  const blacklist = allTitles.length > 0 ? allTitles.join('、') : '无';
  const similarBlacklist = allSimilarWords.length > 0 ? allSimilarWords.join('、') : '无';
  
  // 2. 动态内容策略：前期推热门，后期推冷门
  const isBeginner = totalCollected < 10;
  const contentFocus = isBeginner 
    ? "大众热门、极具趣味性、易于传播的心理学概念，包括但不限于理论、现象、原理、模型、人格特质、心理测试、治疗方法、人格问题、心理障碍、情绪调节、人际关系等" 
    : "冷门、学术深度、前沿研究或心理学细分领域的概念，包括但不限于理论、现象、原理、模型、人格特质、心理测试、治疗方法、人格问题、心理障碍、情绪调节、人际关系等";

  // 3. 构造提示词 (Prompt) - 强调避免重复
  const prompt = `你是一个顶级的心理学家。请生成一个关于【${contentFocus}】的知识条目。
  
  【严格限制】：
  - title (标题): 必须在 12 个字以内，极简且有力。标题必须是真实心理学文献中有记载的概念，可以是理论、现象、原理、模型、定律、悖论、假说、人格特质、心理障碍、治疗方法、人格问题等，不限于"效应"。
  - brief (概括): 必须在 30——100 个字以内，一句话勾起好奇心。
  - detail (解析): 请分为三点详细解析，每点之间使用 \\n 换行。
  - tag (标签): 一个词概括领域，如"社会心理学"、"人格心理学"、"临床心理学"、"认知心理学"、"发展心理学"、"教育心理学"、"人格心理学"、"临床心理学"等。
  - 严禁重复：绝对不要生成以下标题：${blacklist}。
  - 严禁重复：绝对不要生成以下关联词：${similarBlacklist}。
  - 严禁重复：内容主题、案例和应用场景必须与已收藏内容完全不同。
  - 【特别强调】：必须生成全新的、独特的心理学概念，确保与黑名单中的任何内容在主题、案例、应用场景上完全不同。
  - 【学术真实性】：生成的标题必须是真实心理学文献中有记载的概念，包括但不限于理论、现象、原理、模型、定律、悖论、假说、人格特质、心理障碍、治疗方法、评估工具、人格问题等，不限于"效应".

  【内容要求】：
  - story (案例): 必须包含一个经典心理学实验或历史案例，和一个现代社会热点或有趣现象，每个案例不超过80字。案例要生动有趣，引人入胜。格式为："经典案例：[80字内]\n现代热点：[80字内]"
  - extraCase (趣味案例): 一个有趣的心理学现象或小知识，不超过80字，内容要轻松有趣，与日常生活相关。
  - usage (应用): 提供两个具体的现代生活场景应用，每个场景单独成段，如职场、社交媒体、教育等领域。应用要实用且贴近生活。格式为："现代应用1：[具体场景描述]\n现代应用2：[具体场景描述]"

  【输出要求】：
  必须输出纯 JSON 格式，包含以下字段：
  {
    "title": "标题",
    "tag": "领域标签",
    "brief": "核心概括",
    "detail": "深度解析内容",
    "story": "经典案例：[80字内]\n现代热点：[80字内]",
    "extraCase": "一个有趣的心理学现象或小知识，不超过80字",
    "usage": "现代应用1：[具体场景描述]\n现代应用2：[具体场景描述]",
    "similar": "一个相关的心理学关联词（只生成一个关联词即可）"
  }`;

  try {
    const response = await axios.post(`${baseUrl}/chat/completions`, {
      model: "deepseek-chat", // 或者你使用的其他模型名称
      messages: [
        { 
          role: "system", 
          content: "你是一个风趣幽默的心理学专家，擅长用生动有趣的方式解释心理学概念。请确保内容既有学术深度又有趣味性，案例要引人入胜，让读者在轻松愉快的氛围中学习心理学知识。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7, // 降低随机性，提高响应速度
      max_tokens: 800, // 减少最大令牌数，提高响应速度
      response_format: { type: 'json_object' } // 强制要求 JSON 输出
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时
    });

    // 解析并返回 AI 数据
    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("AI Service Error:", error);
    
    // 如果重试次数未达到上限，则重试
    if (retryCount < 2) {
      console.log(`请求失败，正在重试... (${retryCount + 1}/3)`);
      // 等待一段时间后重试，避免频繁请求
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return getPsychologyCard(excludeTitles, totalCollected, retryCount + 1);
    }
    
    // 如果重试次数达到上限，返回一个友好的错误占位卡片
    return {
      title: "连接超时",
      tag: "系统提示",
      brief: "AI 暂时无法获取新知识，请检查网络或配置。",
      detail: "1. 请检查你的 .env 文件中的 API Key 是否正确。\\n2. 确认你的账户余额是否充足。\\n3. 请稍后再试。",
      story: "技术故障通常是由于请求过快或网络波动导致的。",
      usage: "请点击刷新按钮重试。",
      similar: "网络排查"
    };
  }
}

/**
 * 关联词实时注解函数
 * @param {String} word - 需要解释的关联词
 * @param {Number} retryCount - 当前重试次数
 */
export async function getQuickAnnotation(word, retryCount = 0) {
  if (!word) return "无效的关联词";
  
  // 获取当前页面已有的内容，避免重复
  const archive = JSON.parse(localStorage.getItem('psych_archive') || '[]');
  const existingContent = archive.map(item => `${item.title}: ${item.brief}`).join('\n');
  
  console.log("API配置检查:");
  console.log("- API Key:", apiKey ? "已设置" : "未设置");
  console.log("- Base URL:", baseUrl);
  console.log("- 请求词:", word);
  
  try {
    const requestData = {
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: `你是一个心理学专家，请用简洁明了的语言解释心理学概念，不超过80字。
          
【严格限制】：
- 解释内容必须与以下已有内容完全不同：
${existingContent || '无'}` 
        },
        { role: "user", content: `请解释心理学概念："${word}"。` }
      ],
      temperature: 0.7,
      max_tokens: 150
    };
    
    console.log("请求数据:", JSON.stringify(requestData, null, 2));
    
    const response = await axios.post(`${baseUrl}/chat/completions`, requestData, {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000 // 20秒超时
    });
    
    console.log("API响应状态:", response.status);
    console.log("API响应数据:", response.data);
    
    const content = response.data.choices[0].message.content;
    return content.trim();
  } catch (error) {
    console.error("获取关联内容失败:", error);
    
    // 如果重试次数未达到上限，则重试
    if (retryCount < 2) {
      console.log(`关联内容请求失败，正在重试... (${retryCount + 1}/3)`);
      // 等待一段时间后重试，避免频繁请求
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return getQuickAnnotation(word, retryCount + 1);
    }
    
    // 提供更详细的错误信息
    if (error.response) {
      console.error("API响应错误:", error.response.status, error.response.data);
      if (error.response.status === 401) {
        return "API密钥无效，请检查配置。";
      } else if (error.response.status === 429) {
        return "请求过于频繁，请稍后再试。";
      } else if (error.response.status === 400) {
        return "请求参数错误，请检查输入。";
      }
    } else if (error.request) {
      console.error("网络请求失败:", error.request);
      return "网络连接失败，请检查网络设置。";
    } else {
      console.error("其他错误:", error.message);
      return "发生未知错误，请稍后再试。";
    }
    
    return "暂时无法获取关联内容，请稍后再试。";
  }
}