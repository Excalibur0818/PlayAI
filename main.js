// ========== 全局错误处理 ==========

// 全局错误处理函数
function handleGlobalError(error, context = '') {
    console.error('全局错误:', error, '上下文:', context);
    
    // 获取错误信息
    const errorType = error.name || '未知错误';
    const errorMessage = error.message || '未知错误';
    
    // 构建错误URL参数
    const params = new URLSearchParams({
        error: errorType,
        message: errorMessage,
        context: context,
        time: new Date().toISOString()
    });
    
    // 重定向到错误页面
    window.location.href = `errorpage.html?${params.toString()}`;
}

// 设置全局错误监听
window.addEventListener('error', function(e) {
    handleGlobalError(e.error, 'JavaScript运行时错误');
});

window.addEventListener('unhandledrejection', function(e) {
    handleGlobalError(e.reason, '未处理的Promise拒绝');
});

// ========== API Key管理 ==========

document.getElementById('saveApiKey').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const provider = document.getElementById('apiProvider').value;
    
    if (provider === 'local-ai') {
        // 本地AI模式无需API Key
        this.innerHTML = '✅ 本地AI模式已启用';
        setTimeout(() => {
            this.innerHTML = '保存';
        }, 2000);
        return;
    }
    
    if (apiKey) {
        localStorage.setItem(`${provider}_api_key`, apiKey);
        this.innerHTML = '✅ 已保存';
        setTimeout(() => {
            this.innerHTML = '保存';
        }, 2000);
    } else {
        alert('请输入有效的API Key');
    }
});

// API提供商切换处理
document.getElementById('apiProvider').addEventListener('change', function() {
    const provider = this.value;
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiKeyLink = document.getElementById('apiKeyLink');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    
    // 根据不同提供商设置不同的UI
    if (provider === 'local-ai') {
        // 本地AI模式
        apiKeyInput.disabled = true;
        apiKeyInput.placeholder = '无需API Key - 使用本地AI模型';
        apiKeyLink.textContent = '本地AI模式说明';
        apiKeyLink.href = '#';
        saveApiKeyBtn.disabled = true;
        apiKeyInput.value = ''; // 清空输入
    } else {
        // API模式
        apiKeyInput.disabled = false;
        saveApiKeyBtn.disabled = false;
        
        const placeholders = {
            minimax: '输入MiniMax API Key',
            deepseek: '输入DeepSeek API Key',
            glm: '输入GLM API Key'
        };
        
        const linkUrls = {
            minimax: 'https://platform.minimaxi.com',
            deepseek: 'https://platform.deepseek.com',
            glm: 'https://open.bigmodel.cn'
        };
        
        const linkTexts = {
            minimax: '获取免费MiniMax API密钥',
            deepseek: '获取免费DeepSeek API密钥',
            glm: '获取免费GLM API密钥'
        };
        
        apiKeyInput.placeholder = placeholders[provider];
        apiKeyLink.textContent = linkTexts[provider];
        apiKeyLink.href = linkUrls[provider];
        
        // 加载已保存的API Key
        const savedApiKey = localStorage.getItem(`${provider}_api_key`);
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
        } else {
            apiKeyInput.value = ''; // 清空当前输入
        }
    }
});

// 页面加载时恢复设置
window.addEventListener('load', function() {
    // 设置默认提供商为DeepSeek
    const defaultProvider = 'deepseek';
    document.getElementById('apiProvider').value = defaultProvider;
    
    // 更新界面
    const event = new Event('change');
    document.getElementById('apiProvider').dispatchEvent(event);
});

// 表单提交处理
document.getElementById('storyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const puzzleType = document.getElementById('puzzleType').value;
    const difficulty = document.getElementById('difficulty').value;
    
    await generateTurtleSoupWithAI(puzzleType, difficulty);
});

// 生成海龟汤的主函数
async function generateTurtleSoupWithAI(puzzleType, difficulty) {
    const provider = document.getElementById('apiProvider').value;
    
    const generateBtn = document.getElementById('generateBtn');
    const storyOutput = document.getElementById('storyOutput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const storyContent = document.getElementById('storyContent');
    const storyText = document.getElementById('storyText');
    
    const providerNames = {
        minimax: '🤖 MiniMax-M2.1',
        deepseek: '🤖 DeepSeek-3.2',
        glm: '🤖 GLM-5'
    };
    
    generateBtn.disabled = true;
    generateBtn.innerHTML = `${providerNames[provider]} 正在创作海龟汤...`;
    
    storyOutput.classList.remove('hidden');
    loadingIndicator.classList.remove('hidden');
    storyContent.classList.add('hidden');
    
    try {
        const prompt = buildTurtleSoupPrompt(puzzleType, difficulty);
        let turtleSoup;
        
        const apiKey = localStorage.getItem(`${provider}_api_key`);
        
        if (!apiKey) {
            const providerName = provider === 'minimax' ? 'MiniMax' : (provider === 'deepseek' ? 'DeepSeek' : 'GLM');
            throw new Error(`请先配置${providerName} API Key`);
        }
        
        if (provider === 'minimax') {
            turtleSoup = await callMiniMaxAPI(prompt, apiKey);
        } else if (provider === 'deepseek') {
            turtleSoup = await callDeepSeekAPI(prompt, apiKey);
        } else if (provider === 'glm') {
            turtleSoup = await callGLMAPI(prompt, apiKey);
        }
        
        loadingIndicator.classList.add('hidden');
        storyText.textContent = turtleSoup;
        storyContent.classList.remove('hidden');
        
        // 更新当前海龟汤数据用于导出
        updateCurrentTurtleSoupData(puzzleType, difficulty, turtleSoup, provider);
        
    } catch (error) {
        loadingIndicator.classList.add('hidden');
        const errorMessage = error.message || '未知错误';
        storyText.textContent = `❌ 生成失败: ${errorMessage}\n\n请检查网络连接或尝试其他AI提供商。`;
        storyContent.classList.remove('hidden');
    }
    
    generateBtn.disabled = false;
    generateBtn.innerHTML = '🐢 生成海龟汤谜题';
}

// 构建提示词
function buildTurtleSoupPrompt(puzzleType, difficulty) {
    const puzzleTypes = {
        clear: "清汤（温馨治愈风格，故事结局温暖，适合新手）",
        red: "红汤（悬疑刺激风格，有一定惊悚元素，需要推理）", 
        black: "黑汤（恐怖黑暗风格，故事较为黑暗，适合资深玩家）"
    };
    
    const difficultyLevels = {
        easy: "简单（给3-4个明显线索，新手可解）",
        medium: "中等（给2-3个关键线索，需要逻辑推理）",
        hard: "困难（给1-2个隐藏线索，需要深度思考）"
    };
    
    return `请创作一个海龟汤逻辑推理谜题。

要求：
- 谜题类型：${puzzleTypes[puzzleType]}
- 复杂度：${difficultyLevels[difficulty]}
- 语言：中文
- 格式：请用markdown格式，按以下结构：

## 🐢 海龟汤谜题

### 谜面（情境描述）
描述一个看似不可能或令人困惑的情境

### 关键线索（1-4个）
提供帮助推理的重要线索

### 推理过程
展示完整的逻辑推理步骤

### 最终答案
揭示事情真相和完整故事

请确保谜题有趣、逻辑严密、答案合理。海龟汤的魅力在于通过有限的线索推理出令人意想不到的真相。`;
}

// 调用MiniMax API
async function callMiniMaxAPI(prompt, apiKey) {
    const response = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'abab6.5s-chat',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        throw new Error(`MiniMax API调用失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// 调用DeepSeek API
async function callDeepSeekAPI(prompt, apiKey) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        throw new Error(`DeepSeek API调用失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * 调用GLM API生成海龟汤
 * @param {string} prompt - 提示词
 * @param {string} apiKey - GLM API密钥
 * @returns {Promise<string>} 生成的海龟汤内容
 */
async function callGLMAPI(prompt, apiKey) {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'glm-4-flash',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        throw new Error(`GLM API调用失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// ========== 本地AI模式实现 ==========

// 全局变量存储模型和tokenizer
let localAIModel = null;
let localAITokenizer = null;

// 初始化本地AI模型
async function initializeLocalAI() {
    try {
        // 确保Transformers.js已经加载
        if (!window.transformers) {
            throw new Error('Transformers.js库未加载，请检查网络连接');
        }
        
        // 显示加载状态
        const statusElement = document.getElementById('localAIStatus');
        if (statusElement) {
            statusElement.textContent = '⏳ 正在加载本地AI模型，请稍候...';
            statusElement.className = 'text-blue-600 text-sm';
        }
        
        // 首先尝试加载超轻量级的GPT-2模型
        const modelId = 'Xenova/gpt2';
        
        console.log('开始加载本地AI模型...');
        
        // 初始化tokenizer
        localAITokenizer = await window.transformers.AutoTokenizer.from_pretrained(modelId, {
            progress_callback: (progress) => {
                if (progress.status === 'downloading') {
                    const percentage = Math.round((progress.loaded / progress.total) * 100);
                    if (statusElement) {
                        statusElement.textContent = `⏳ 正在下载Tokenizer (${percentage}%)...`;
                    }
                }
                console.log('Tokenizer加载进度:', progress);
            }
        });
        
        // 初始化模型
        localAIModel = await window.transformers.AutoModelForCausalLM.from_pretrained(modelId, {
            progress_callback: (progress) => {
                if (progress.status === 'downloading') {
                    const percentage = Math.round((progress.loaded / progress.total) * 100);
                    if (statusElement) {
                        statusElement.textContent = `⏳ 正在下载模型 (${percentage}%)...`;
                    }
                }
                console.log('模型加载进度:', progress);
            }
        });
        
        // 加载成功后更新状态
        if (statusElement) {
            statusElement.textContent = '✅ 本地AI模型加载完成！';
            statusElement.className = 'text-green-600 text-sm';
        }
        
        console.log('本地AI模型初始化成功');
        return true;
    } catch (error) {
        console.error('本地AI模型初始化失败:', error);
        
        // 提供更详细的错误信息
        let errorMessage = '本地AI模型加载失败';
        if (error.message.includes('Network')) {
            errorMessage = '网络连接问题，请检查网络连接';
        } else if (error.message.includes('Memory')) {
            errorMessage = '设备内存不足，无法加载模型';
        } else if (error.message.includes('CORS')) {
            errorMessage = '网络环境限制，无法下载模型文件';
        } else if (error.message.includes('Transformers')) {
            errorMessage = 'Transformers.js库加载失败';
        }
        
        const statusElement = document.getElementById('localAIStatus');
        if (statusElement) {
            statusElement.innerHTML = `❌ ${errorMessage}<br><small>建议使用MiniMax或DeepSeek API模式</small>`;
            statusElement.className = 'text-red-600 text-sm';
        }
        
        return false;
    }
}

// 使用本地AI生成文本
async function generateWithLocalAI(prompt, puzzleType, era, difficulty) {
    // 如果模型还未初始化，先初始化
    if (!localAIModel || !localAITokenizer) {
        const initSuccess = await initializeLocalAI();
        if (!initSuccess) {
            throw new Error('本地AI模型初始化失败');
        }
    }

    try {
        // 优化提示词，让模型更好地生成海龟汤内容
        const optimizedPrompt = optimizePromptForLocalAI(prompt, puzzleType, era, difficulty);
        
        // 准备输入
        const inputs = localAITokenizer.encode(optimizedPrompt, {
            return_tensors: 'pt'
        });
        
        // 生成文本
        const outputs = await localAIModel.generate(inputs, {
            max_length: 800,
            temperature: 0.8,
            top_k: 40,
            top_p: 0.9,
            do_sample: true,
            pad_token_id: localAITokenizer.eos_token_id
        });
        
        // 解码生成的文本
        const generatedText = localAITokenizer.decode(outputs[0], {
            skip_special_tokens: true
        });
        
        // 提取有效内容
        const extractedContent = extractValidContent(generatedText, optimizedPrompt);
        
        return formatLocalAIResponse(extractedContent, puzzleType, era, difficulty);
        
    } catch (error) {
        console.error('本地AI生成失败:', error);
        
        // 提供更具体的错误信息
        let errorMessage = '本地AI生成失败';
        if (error.name === 'NetworkError' || error.message.includes('fetch')) {
            errorMessage = '网络错误，请检查网络连接';
        } else if (error.name === 'OutOfMemoryError') {
            errorMessage = '内存不足，设备性能可能不足';
        } else if (error.message.includes('model')) {
            errorMessage = '模型加载失败，请刷新页面重试';
        }
        
        // 重置模型状态，以便下次可以重新初始化
        localAIModel = null;
        localAITokenizer = null;
        
        // 抛出具体的错误信息
        throw new Error(errorMessage);
    }
}

// 优化提示词以适应轻量级模型
function optimizePromptForLocalAI(originalPrompt, puzzleType, era, difficulty) {
    // 提取关键信息
    const typeMap = {
        death: '死亡之谜',
        identity: '身份之谜',
        behavior: '行为之谜',
        mystery: '悬疑事件',
        logic: '逻辑悖论'
    };
    
    const eraMap = {
        ancient: '古代',
        modern: '现代'
    };
    
    const difficultyMap = {
        easy: '简单',
        medium: '中等',
        hard: '困难'
    };
    
    // 构建简化的提示词
    const simplePrompt = `创建一个${eraMap[era]}的${typeMap[puzzleType]}，难度为${difficultyMap[difficulty]}。谜题应该包含：1.谜面描述 2.关键线索 3.推理过程 4.最终答案。海龟汤谜题:`;
    
    return simplePrompt;
}

// 提取生成文本中的有效内容
function extractValidContent(generatedText, prompt) {
    // 找到提示词结束的位置
    const promptEnd = generatedText.indexOf(prompt);
    const contentStart = promptEnd + prompt.length;
    
    if (promptEnd === -1) {
        // 如果找不到提示词，使用全部生成的文本
        return generatedText;
    }
    
    let content = generatedText.substring(contentStart);
    
    // 清理内容，移除多余的空格和换行
    content = content.replace(/\n+/g, '\n').trim();
    
    // 如果内容太短，返回null
    if (content.length < 100) {
        return null;
    }
    
    return content;
}

// 格式化本地AI的响应
function formatLocalAIResponse(content, puzzleType, era, difficulty) {
    if (!content) {
        // 如果没有有效内容，抛出错误让上层处理
        throw new Error('本地AI生成的文本质量不符合要求');
    }
    
    // 尝试格式化内容
    let formattedContent = content;
    
    // 确保内容包含基本的海龟汤结构
    if (!formattedContent.includes('海龟汤') && !formattedContent.includes('谜题')) {
        formattedContent = `## 🐢 海龟汤谜题\n\n${formattedContent}`;
    }
    
    // 添加本地AI标识
    formattedContent += `\n\n🤖 此海龟汤由本地AI模型生成，无需API Key即可体验！`;
    
    return formattedContent;
}

// ========== 工具函数 ==========

// 检查设备性能，决定是否使用本地AI
function isDeviceSuitableForLocalAI() {
    // 检查内存
    const memory = navigator.deviceMemory || 4; // 默认4GB
    
    // 检查是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 检查是否为现代浏览器
    const isModernBrowser = 'WebAssembly' in window;
    
    // 检查是否支持transformers
    const hasTransformers = typeof window.transformers !== 'undefined';
    
    // 检查CPU核心数
    const cores = navigator.hardwareConcurrency || 2;
    
    console.log('设备检测:', {
        memory: `${memory}GB`,
        isMobile,
        isModernBrowser,
        hasTransformers,
        cores
    });
    
    // 更严格的性能评估
    if (memory >= 4 && isModernBrowser && hasTransformers && cores >= 2 && !isMobile) {
        return true;
    }
    
    return false;
}

// 显示本地AI模式状态
function updateLocalAIStatus() {
    const isSuitable = isDeviceSuitableForLocalAI();
    const statusElement = document.getElementById('localAIStatus');
    
    if (statusElement) {
        if (isSuitable) {
            statusElement.textContent = '✅ 您的设备支持本地AI模式';
            statusElement.className = 'text-green-600 text-sm';
        } else {
            // 提供详细的故障排除信息
            const memory = navigator.deviceMemory || 4;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isModernBrowser = 'WebAssembly' in window;
            const hasTransformers = typeof window.transformers !== 'undefined';
            
            let reason = '';
            if (!isModernBrowser) reason += '浏览器不支持 | ';
            if (!hasTransformers) reason += '库未加载 | ';
            if (isMobile) reason += '移动设备 | ';
            if (memory < 4) reason += '内存不足';
            
            statusElement.innerHTML = `⚠️ ${reason}<br><small>建议使用API模式或检查设备性能</small>`;
            statusElement.className = 'text-yellow-600 text-sm';
        }
    }
}

// 页面加载时初始化本地AI状态
window.addEventListener('load', function() {
    updateLocalAIStatus();
    
    // 如果选择的是本地AI模式，尝试预加载模型
    const provider = document.getElementById('apiProvider').value;
    if (provider === 'local-ai' && isDeviceSuitableForLocalAI()) {
        // 在后台预加载模型（不阻塞界面）
        setTimeout(() => {
            initializeLocalAI().then(success => {
                if (success) {
                    console.log('✅ 本地AI模型预加载完成');
                } else {
                    console.warn('⚠️ 本地AI模型预加载失败');
                }
            });
        }, 1000);
    }
});

// ========== 导出功能 ==========

/**
 * 存储当前生成的海龟汤数据
 */
let currentTurtleSoupData = null;

/**
 * 更新当前海龟汤数据
 * @param {string} puzzleType - 谜题类型（清汤/红汤/黑汤）
 * @param {string} difficulty - 难度级别
 * @param {string} content - 生成的海龟汤内容
 * @param {string} provider - AI提供商
 */
function updateCurrentTurtleSoupData(puzzleType, difficulty, content, provider) {
    const puzzleTypeNames = {
        clear: '清汤',
        red: '红汤',
        black: '黑汤'
    };
    
    const difficultyNames = {
        easy: '简单',
        medium: '中等',
        hard: '困难'
    };
    
    const providerNames = {
        minimax: 'MiniMax-M2.1',
        deepseek: 'DeepSeek-3.2',
        glm: 'GLM-5'
    };
    
    currentTurtleSoupData = {
        id: generateUUID(),
        title: `海龟汤谜题 - ${puzzleTypeNames[puzzleType]}`,
        type: puzzleType,
        typeName: puzzleTypeNames[puzzleType],
        difficulty: difficulty,
        difficultyName: difficultyNames[difficulty],
        content: content,
        provider: provider,
        providerName: providerNames[provider],
        createdAt: new Date().toISOString(),
        version: '1.0'
    };
}

/**
 * 生成UUID
 * @returns {string} UUID字符串
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 导出海龟汤谜题为JSON文件
 */
function exportTurtleSoupToJSON() {
    if (!currentTurtleSoupData) {
        alert('请先生成一个海龟汤谜题！');
        return;
    }
    
    const jsonStr = JSON.stringify(currentTurtleSoupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `turtle-soup-${currentTurtleSoupData.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 导出按钮点击事件
document.getElementById('exportBtn').addEventListener('click', exportTurtleSoupToJSON);