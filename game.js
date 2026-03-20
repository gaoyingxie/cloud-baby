/**
 * ☁️ 云养娃 v5.1 - 深度养成系统
 * 新增：阶段转换庆典、各阶段正向成长事件
 */

// ==================== 游戏配置 ====================
const CONFIG = {
    TOTAL_TURNS: 48,
    STAGES: [
        { name: '婴儿期', start: 0, end: 8, emoji: '👶', income: 3000, eventChance: 0.5 },
        { name: '幼儿园', start: 8, end: 16, emoji: '🧒', income: 4000, eventChance: 0.4 },
        { name: '小学', start: 16, end: 32, emoji: '👦', income: 5000, eventChance: 0.35 },
        { name: '初中', start: 32, end: 40, emoji: '🎒', income: 6000, eventChance: 0.3 },
        { name: '高中', start: 40, end: 48, emoji: '📚', income: 7000, eventChance: 0.25 }
    ]
};

// ==================== 属性系统说明 ====================
/*
😊 情绪(mood): 影响叛逆事件概率，低情绪容易出心理问题
❤️ 健康(health): 影响生病概率，健康<30强制住院
💪 体力(energy): 影响学习效率，体力<20无法学习
🧠 智商(iq): 影响学习效果和科技路线
👥 情商(eq): 影响人际关系和社交路线  
🎨 才艺(talent): 影响艺术路线和特长加分
✨ 魅力(charm): 影响早恋、网红路线、人际关系
📏 自律(discipline): 影响抗诱惑能力，低自律容易沉迷
📖 学业(academic): 影响高考成绩（学术路线）
💰 金钱: 购买道具、报班、医疗
*/

// ==================== 天生词条（更丰富）====================
const BORN_TRAITS = [
    // 学术路线
    { name: '🧠 神童', desc: '智商超群，学习事半功倍', effect: { iq: +20, academic: +10 }, color: '#FFD700', route: 'academic' },
    { name: '📚 过目不忘', desc: '记忆力惊人', effect: { iq: +10, academic: +15 }, color: '#3498DB', route: 'academic' },
    
    // 艺术路线
    { name: '🎨 艺术天才', desc: '天生的艺术家', effect: { talent: +25, mood: +10 }, color: '#9B59B6', route: 'art' },
    { name: '🎵 音乐神童', desc: '绝对音感', effect: { talent: +20, charm: +10 }, color: '#E74C3C', route: 'art' },
    
    // 体育路线
    { name: '⚡ 运动健将', desc: '身体素质极佳', effect: { health: +20, energy: +15, talent: +5 }, color: '#FF6B6B', route: 'sports' },
    { name: '🏃 体能怪物', desc: '精力充沛', effect: { energy: +25, health: +10 }, color: '#E67E22', route: 'sports' },
    
    // 社交路线
    { name: '💬 社交达人', desc: '天生善于交际', effect: { eq: +20, charm: +15 }, color: '#4ECDC4', route: 'social' },
    { name: '👑 天生领袖', desc: '具有领导气质', effect: { eq: +15, charm: +15, discipline: +5 }, color: '#F39C12', route: 'social' },
    
    // 网红路线
    { name: '📱 镜头感强', desc: '天生适合当网红', effect: { charm: +25, talent: +5 }, color: '#E91E63', route: 'internet' },
    { name: '😎 颜值担当', desc: '长得特别好看', effect: { charm: +20, mood: +10 }, color: '#FF5722', route: 'internet' },
    
    // 负面词条
    { name: '🌀 多动症', desc: '注意力难以集中', effect: { discipline: -20, iq: -5 }, color: '#E74C3C', route: 'negative' },
    { name: '😷 体弱多病', desc: '经常生病住院', effect: { health: -20, energy: -15 }, color: '#95A5A6', route: 'negative' },
    { name: '😶 社恐患者', desc: '害怕与人交往', effect: { eq: -20, charm: -15 }, color: '#7F8C8D', route: 'negative' },
    { name: '😤 天生反骨', desc: '特别叛逆难管', effect: { discipline: -25, mood: -10 }, color: '#C0392B', route: 'negative' },
    { name: '💤 嗜睡成性', desc: '每天睡不够', effect: { energy: -20 }, color: '#8E44AD', route: 'negative' },
    { name: '🍔 大胃王', desc: '特别能吃', effect: { health: -10, energy: +5 }, color: '#D35400', route: 'negative' },
    
    // 特殊词条
    { name: '🌙 夜猫子', desc: '晚上精神白天困', effect: { energy: +10, mood: -5, iq: +5 }, color: '#2C3E50', route: 'special' },
    { name: '🎮 电竞天才', desc: '游戏天赋异禀', effect: { iq: +10, discipline: -10, talent: +5 }, color: '#E67E22', route: 'special' },
    { name: '📖 书呆子', desc: '只爱读书', effect: { iq: +15, eq: -10, charm: -5 }, color: '#16A085', route: 'special' },
    { name: '🔧 动手达人', desc: '喜欢拆东西', effect: { iq: +5, talent: +10, discipline: -5 }, color: '#607D8B', route: 'special' }
];

function generateTraits() {
    const traits = [];
    const count = Math.random() < 0.25 ? 2 : 1;
    const available = [...BORN_TRAITS];
    
    for (let i = 0; i < count; i++) {
        if (available.length === 0) break;
        const index = Math.floor(Math.random() * available.length);
        traits.push(available[index]);
        available.splice(index, 1);
    }
    
    return traits;
}

// ==================== 条件事件系统 ====================
// 根据属性状态触发，不再是纯随机

function getConditionalEvent(state) {
    const child = state.child;
    const stage = state.getStage();
    const possibleEvents = [];
    
    // ========== 健康危机事件 ==========
    if (child.health < 15) {
        possibleEvents.push({
            id: 'critical_sick',
            title: '🏥 重病住院',
            desc: `${state.child.name}身体太差，必须住院治疗！`,
            priority: 100, // 最高优先级
            choices: [
                { text: '💰 花大价钱治疗', icon: '💰', cost: 3000, effect: { child: { health: +50 }, parent: { money: -3000 } }, log: '你花了3000元住院治疗。' },
                { text: '🏠 在家静养', icon: '🏠', effect: { child: { health: +20, academic: -10 }, parent: { energy: -30 } }, log: '在家静养，恢复较慢。' }
            ]
        });
    } else if (child.health < 35) {
        possibleEvents.push({
            id: 'sick_warning',
            title: '😷 身体虚弱',
            desc: `${state.child.name}看起来很不舒服...`,
            priority: 80,
            choices: [
                { text: '🏥 看医生', icon: '🏥', cost: 500, effect: { child: { health: +25 }, parent: { money: -500 } }, log: '及时就医，病情好转。' },
                { text: '💊 买药吃', icon: '💊', cost: 100, effect: { child: { health: +10 }, parent: { money: -100 } }, log: '吃了药，稍微好一点。' },
                { text: '🙏 硬扛', icon: '🙏', effect: { child: { health: -15, mood: -10 } }, log: '硬扛导致病情加重。' }
            ]
        });
    }
    
    // ========== 情绪危机事件 ==========
    if (child.mood < 10) {
        possibleEvents.push({
            id: 'depression',
            title: '💔 心理危机',
            desc: `${state.child.name}情绪崩溃，可能有抑郁症倾向...`,
            priority: 95,
            choices: [
                { text: '👨‍⚕️ 看心理医生', icon: '👨‍⚕️', cost: 2000, effect: { child: { mood: +40, health: +10 }, parent: { money: -2000, energy: -20 } }, log: '专业心理咨询起了作用。' },
                { text: '🤗 请长假陪伴', icon: '🤗', effect: { child: { mood: +25 }, parent: { energy: -40, money: -2000 } }, log: '你的陪伴让TA慢慢好转。' },
                { text: '😤 批评要坚强', icon: '😤', effect: { child: { mood: -30, health: -15, discipline: -10 } }, log: '批评让情况更糟了。' }
            ]
        });
    } else if (child.mood < 25) {
        possibleEvents.push({
            id: 'rebellion_mood',
            title: '😤 严重叛逆',
            desc: `${state.child.name}情绪很差，处处和你对着干。`,
            priority: 75,
            choices: [
                { text: '💬 耐心沟通', icon: '💬', effect: { child: { mood: +20, eq: +3 }, parent: { energy: -25 } }, log: '沟通缓解了矛盾。' },
                { text: '🎁 买礼物哄', icon: '🎁', cost: 800, effect: { child: { mood: +15 }, parent: { money: -800 } }, log: '礼物让TA开心了一点。' },
                { text: '🔨 严厉管教', icon: '🔨', effect: { child: { mood: -25, discipline: +5 }, parent: { energy: -15 } }, log: '严厉管教适得其反。' }
            ]
        });
    }
    
    // ========== 体力不足事件 ==========
    if (child.energy < 20) {
        possibleEvents.push({
            id: 'exhausted',
            title: '😴 过度疲劳',
            desc: `${state.child.name}太累了，根本无法集中精力。`,
            priority: 70,
            choices: [
                { text: '😴 强制休息', icon: '😴', effect: { child: { energy: +30, mood: +5 } }, log: '好好休息恢复了精力。' },
                { text: '📚 坚持学习', icon: '📚', effect: { child: { energy: -10, health: -10, iq: +2 }, parent: { energy: -20 } }, log: '透支身体学习，效果很差。' },
                { text: '🎮 玩游戏放松', icon: '🎮', effect: { child: { energy: +20, mood: +10, discipline: -5 } }, log: '玩游戏恢复了精力但上瘾了。' }
            ]
        });
    }
    
    // ========== 特殊条件事件 ==========
    // 高智商+低自律 = 天才但难管
    if (child.iq > 80 && child.discipline < 30 && stage.name !== '婴儿期') {
        possibleEvents.push({
            id: 'genius_trouble',
            title: '🧠 天才的烦恼',
            desc: `${state.child.name}太聪明了，觉得上课无聊开始捣乱。`,
            priority: 60,
            choices: [
                { text: '📚 给难题挑战', icon: '📚', effect: { child: { iq: +5, discipline: +3, mood: +5 } }, log: '难题激发了TA的兴趣。' },
                { text: '👨‍🏫 请私教', icon: '👨‍🏫', cost: 2000, effect: { child: { iq: +8, discipline: +5, academic: +5 }, parent: { money: -2000 } }, log: '私教因材施教，效果很好。' },
                { text: '🔨 惩罚管教', icon: '🔨', effect: { child: { iq: -5, discipline: +10, mood: -20 } }, log: '惩罚让TA产生了厌学情绪。' }
            ]
        });
    }
    
    // 高魅力+初中以上 = 早恋高发
    if (child.charm > 75 && child.mood > 50 && stage.name !== '婴儿期' && stage.name !== '幼儿园') {
        possibleEvents.push({
            id: 'puppy_love',
            title: '💕 早恋了',
            desc: `${state.child.name}和班上的同学走得特别近，好像谈恋爱了。`,
            priority: 55,
            choices: [
                { text: '💬 理解引导', icon: '💬', effect: { child: { eq: +8, mood: +10, academic: -2 }, parent: { energy: -15 } }, log: '你的理解让TA更愿意和你分享。' },
                { text: '💔 强行拆散', icon: '💔', effect: { child: { mood: -30, eq: -5, discipline: -10 } }, log: '强行拆散让TA非常反感。' },
                { text: '📚 约定成绩', icon: '📚', effect: { child: { discipline: +5, academic: +5, mood: +5 } }, log: '约定不影响学习，双方都接受了。' }
            ]
        });
    }
    
    // 高才艺+情绪好 = 展示机会
    if (child.talent > 70 && child.mood > 60 && stage.name !== '婴儿期') {
        possibleEvents.push({
            id: 'talent_show',
            title: '🎭 才艺展示机会',
            desc: `${state.child.name}有机会参加才艺比赛/表演。`,
            priority: 50,
            choices: [
                { text: '✨ 全力支持', icon: '✨', cost: 1000, effect: { child: { talent: +10, charm: +5, mood: +10, academic: -3 }, parent: { money: -1000 } }, log: '精彩表演获得了好评！' },
                { text: '📚 以学习为重', icon: '📚', effect: { child: { talent: +2, academic: +3, mood: -10 } }, log: '错过了机会，有点遗憾。' }
            ]
        });
    }
    
    // ========== 负面调节事件（防止健康/情绪一直涨）==========
    // 健康良好时可能发生意外（婴儿期除外）
    if (stage.name !== '婴儿期' && child.health > 70 && Math.random() < 0.15) {
        possibleEvents.push({
            id: 'accident',
            title: '🤕 意外受伤',
            desc: `${state.child.name}玩耍时不小心摔了一跤！`,
            priority: 40,
            choices: [
                { text: '🏥 去医院', icon: '🏥', cost: 800, effect: { child: { health: -10, mood: -5 }, parent: { money: -800 } }, log: '去了医院，没什么大问题。' },
                { text: '🩹 自己处理', icon: '🩹', effect: { child: { health: -20, mood: -10 } }, log: '自己处理了伤口，恢复较慢。' }
            ]
        });
    }
    
    // 高健康+高学业压力 = 过劳风险
    if (child.health > 60 && child.academic > 60 && stage.name !== '婴儿期' && stage.name !== '幼儿园') {
        possibleEvents.push({
            id: 'overwork',
            title: '😵 学习过劳',
            desc: `${state.child.name}学习太拼命，身体开始吃不消了。`,
            priority: 45,
            choices: [
                { text: '😴 强制休息一周', icon: '😴', effect: { child: { health: +10, academic: -5, mood: +5 } }, log: '强制休息后恢复了精神。' },
                { text: '📚 再坚持一下', icon: '📚', effect: { child: { health: -20, academic: +5, mood: -15 } }, log: '继续学习，但身体更差了。' }
            ]
        });
    }
    
    // 高情绪时可能遇到挫折
    if (child.mood > 75 && Math.random() < 0.25) {
        possibleEvents.push({
            id: 'setback',
            title: '😢 遇到挫折',
            desc: `${state.child.name}遇到了一些不顺心的事，情绪低落。`,
            priority: 35,
            choices: [
                { text: '🤗 安慰鼓励', icon: '🤗', effect: { child: { mood: -10, eq: +3 } }, log: '你的安慰让TA好受了一些。' },
                { text: '💪 让TA自己扛', icon: '💪', effect: { child: { mood: -25, discipline: +5 } }, log: '让TA自己面对挫折。' }
            ]
        });
    }
    
    // 被欺负事件（影响情绪和健康）
    if (stage.name !== '婴儿期' && Math.random() < 0.2) {
        possibleEvents.push({
            id: 'bullied',
            title: '😭 被欺负了',
            desc: `${state.child.name}在学校被同学欺负了，哭着回家。`,
            priority: 55,
            choices: [
                { text: '🤗 安慰并找老师', icon: '🤗', effect: { child: { mood: +10, health: -5, eq: +3 }, parent: { energy: -15 } }, log: '找老师沟通后情况好转了。' },
                { text: '🥊 教TA打回去', icon: '🥊', effect: { child: { mood: -5, health: -10, discipline: -5 } }, log: '以暴制暴让情况更复杂了。' },
                { text: '🙈 忍一忍算了', icon: '🙈', effect: { child: { mood: -20, health: -5 } }, log: '一味忍让让TA更委屈。' }
            ]
        });
    }
    
    // 考试失利（影响情绪）
    if (child.academic > 30 && stage.name !== '婴儿期' && stage.name !== '幼儿园' && Math.random() < 0.25) {
        possibleEvents.push({
            id: 'exam_fail',
            title: '📉 考试考砸了',
            desc: `这次考试${state.child.name}发挥失常，成绩很差。`,
            priority: 42,
            choices: [
                { text: '💬 分析原因鼓励', icon: '💬', effect: { child: { mood: -5, academic: +3, discipline: +3 } }, log: '分析原因后TA重新振作了。' },
                { text: '😤 严厉批评', icon: '😤', effect: { child: { mood: -30, academic: +5, discipline: +5 } }, log: '严厉批评让TA压力很大。' },
                { text: '🎁 安慰送礼物', icon: '🎁', cost: 500, effect: { child: { mood: +5, academic: +2 }, parent: { money: -500 } }, log: '礼物让TA心情好转了。' }
            ]
        });
    }
    
    // 青春期 acne/长痘（影响魅力和情绪）
    if (stage.name === '初中' || stage.name === '高中') {
        possibleEvents.push({
            id: 'puberty_acne',
            title: '😫 青春期烦恼',
            desc: `${state.child.name}最近满脸青春痘，变得很自卑。`,
            priority: 30,
            choices: [
                { text: '💊 买护肤品', icon: '💊', cost: 600, effect: { child: { charm: +5, mood: +10 }, parent: { money: -600 } }, log: '买了护肤品，情况好转了。' },
                { text: '💬 开导TA', icon: '💬', effect: { child: { charm: +2, mood: +5, eq: +3 } }, log: '你的开导让TA不那么在意了。' }
            ]
        });
    }
    
    // ========== 大额消费事件（解决金钱溢出）==========
    // 学区房/换房事件
    if (stage.name === '小学' && state.parent.money > 50000) {
        possibleEvents.push({
            id: 'buy_house',
            title: '🏠 学区房机会',
            desc: '有个重点小学的学区房在售，要咬牙买吗？',
            priority: 45,
            choices: [
                { text: '💰 贷款买下（20万）', icon: '🏠', cost: 20000, effect: { child: { academic: +15, mood: +5 } }, log: '咬牙买下学区房，孩子学习环境更好了！' },
                { text: '💸 全款拿下（50万）', icon: '⭐', cost: 50000, effect: { child: { academic: +25, mood: +10, charm: +5 } }, log: '全款拿下豪宅，孩子开心极了！' },
                { text: '😔 买不起', icon: '❌', effect: { child: { mood: -5 } }, log: '错过了学区房机会。' }
            ]
        });
    }
    
    // 出国留学考察（需要高学业或高智商）
    if (stage.name === '高中' && state.parent.money > 80000 && (state.child.academic > 50 || state.child.iq > 70)) {
        possibleEvents.push({
            id: 'study_abroad',
            title: '✈️ 留学机会',
            desc: '有海外名校的预科项目，需要高学业水平。',
            priority: 48,
            choices: [
                { text: '✈️ 送TA出国（8万）', icon: '✈️', cost: 80000, effect: { child: { academic: +20, eq: +10, mood: +15 } }, log: '送孩子出国留学，开拓了眼界！' },
                { text: '📚 留在国内', icon: '🏠', effect: { child: { academic: +5 } }, log: '决定在国内参加高考。' }
            ]
        });
    }
    
    // 投资教育基金
    if (state.parent.money > 30000 && ['小学', '初中', '高中'].includes(stage.name)) {
        possibleEvents.push({
            id: 'education_fund',
            title: '💼 教育投资',
            desc: '有人推荐教育基金投资，收益高风险也高。',
            priority: 30,
            choices: [
                { text: '💰 投资3万', icon: '📈', cost: 30000, effect: { parent: { money: Math.random() > 0.5 ? 60000 : 10000 } }, log: Math.random() > 0.5 ? '投资成功，翻倍回本！' : '投资失败，损失惨重...' },
                { text: '🛡️ 稳健理财', icon: '🏦', effect: { parent: { money: 5000 } }, log: '稳健理财，小赚一笔。' },
                { text: '❌ 不投资', icon: '❌', effect: {}, log: '决定不冒险投资。' }
            ]
        });
    }
    
    // 暑期海外游学
    if (state.parent.money > 60000 && ['小学', '初中'].includes(stage.name)) {
        possibleEvents.push({
            id: 'summer_camp',
            title: '🌍 海外夏令营',
            desc: '世界名校暑期游学项目，为期一个月。',
            priority: 45,
            choices: [
                { text: '✈️ 报名参加（6万）', icon: '🌍', cost: 60000, effect: { child: { iq: +8, eq: +10, mood: +15, charm: +5 } }, log: '海外游学开拓了孩子的国际视野！' },
                { text: '🏠 国内旅游', icon: '🏠', cost: 10000, effect: { child: { mood: +8, eq: +3 } }, log: '国内旅游也很开心。' },
                { text: '📚 暑假补课', icon: '📚', effect: { child: { academic: +5, mood: -5 } }, log: '暑假在家学习。' }
            ]
        });
    }
    
    // 贵族学校转学
    if (state.parent.money > 100000 && ['初中', '高中'].includes(stage.name)) {
        possibleEvents.push({
            id: 'elite_school',
            title: '🏫 贵族学校邀请',
            desc: '当地顶尖贵族学校发来邀请函，年费30万。',
            priority: 55,
            choices: [
                { text: '💎 转学（30万/年）', icon: '🏫', cost: 300000, effect: { child: { academic: +25, eq: +15, charm: +10, mood: +10 } }, log: '进入贵族学校，人脉和资源都升级了！' },
                { text: '🏠 留在原校', icon: '🏠', effect: { child: { mood: -3 } }, log: '留在原来的学校继续就读。' }
            ]
        });
    }
    
    // 买豪车奖励
    if (state.parent.money > 150000 && stage.name === '高中') {
        possibleEvents.push({
            id: 'luxury_car',
            title: '🚗 考好奖车',
            desc: '孩子考上名校模拟考第一名，答应奖励一辆车。',
            priority: 40,
            choices: [
                { text: '🚗 买豪车（30万）', icon: '🚗', cost: 300000, effect: { child: { mood: +30, charm: +15, discipline: -10 } }, log: '豪车奖励让TA飘飘然...' },
                { text: '🎁 其他奖励', icon: '🎁', cost: 50000, effect: { child: { mood: +15, discipline: +5 } }, log: '理性奖励，孩子依然很开心。' }
            ]
        });
    }
    
    // 创业机会（富二代培养）
    if (state.parent.money > 120000 && stage.name === '高中') {
        possibleEvents.push({
            id: 'business_startup',
            title: '💼 创业基金',
            desc: '孩子有个创业想法，想要启动资金。',
            priority: 48,
            choices: [
                { text: '💰 投资50万', icon: '💰', cost: 500000, effect: { child: { iq: +10, eq: +15, discipline: +5, mood: +20 } }, log: '支持孩子创业，培养商业头脑！' },
                { text: '📚 先读书', icon: '📚', effect: { child: { mood: -10, academic: +5 } }, log: '建议先完成学业。' }
            ]
        });
    }
    
    // 按优先级排序，返回最高优先级的事件
    if (possibleEvents.length > 0) {
        possibleEvents.sort((a, b) => b.priority - a.priority);
        return possibleEvents[0];
    }
    
    return null; // 没有条件事件触发
}

// ==================== 随机事件池 ====================
const RANDOM_EVENTS = {
    baby: [
        { id: 'hungry', title: '🍼 饿了', desc: '宝宝肚子咕咕叫', 
          choices: [{ text: '喂奶', icon: '🍼', effect: { child: { mood: +10, health: +5 }, parent: { energy: -10 } } },
                   { text: '哄睡', icon: '😴', effect: { child: { mood: +5 }, parent: { energy: -5 } } }] },
        { id: 'diaper', title: '💩 换尿布', desc: '一股异味传来...', 
          choices: [{ text: '马上换', icon: '🧻', effect: { child: { mood: +5, health: +3 }, parent: { energy: -5 } } },
                   { text: '等会再说', icon: '⏰', effect: { child: { mood: -5, health: -2 } } }] },
        { id: 'cry_night', title: '🌙 夜哭', desc: '半夜突然大哭不止', 
          choices: [{ text: '抱起来哄', icon: '🤱', effect: { child: { mood: +8 }, parent: { energy: -15 } } },
                   { text: '检查尿布', icon: '🧻', effect: { child: { mood: +5 }, parent: { energy: -8 } } }] },
        { id: 'first_word', title: '💬 第一次说话', desc: '宝宝咿咿呀呀好像在叫妈妈！', 
          choices: [{ text: '激动鼓励', icon: '❤️', effect: { child: { mood: +10, eq: +3 }, parent: { energy: -5 } } },
                   { text: '录下来', icon: '📱', effect: { child: { mood: +5, eq: +2 }, parent: { energy: -5 } } }] },
        { id: 'stranger', title: '👶 认生', desc: '家里来了客人，宝宝有点怕生', 
          choices: [{ text: '温柔安抚', icon: '🤗', effect: { child: { mood: +8, eq: +3 } } },
                   { text: '陪TA一起欢迎', icon: '👋', effect: { child: { mood: +5, eq: +5 } } }] },
        { id: 'teething', title: '🦷 长牙不适', desc: '宝宝牙龈肿胀，有点烦躁', 
          choices: [{ text: '买磨牙棒', icon: '🦴', cost: 100, effect: { child: { mood: +10, health: +5 }, parent: { money: -100 } } },
                   { text: '用冰毛巾敷', icon: '🧊', effect: { child: { mood: +6 }, parent: { energy: -5 } } }] },
        { id: 'sleep_training', title: '😴 睡眠训练', desc: '要不要让宝宝独立入睡？', 
          choices: [{ text: '训练独立', icon: '💪', effect: { child: { discipline: +5, mood: +3 }, parent: { energy: +10 } } },
                   { text: '继续陪睡', icon: '🤱', effect: { child: { mood: +5, discipline: -2 }, parent: { energy: -10 } } }] },
        // ===== 正向成长事件 =====
        { id: 'first_step', title: '🚶 第一次走路', desc: '宝宝摇摇晃晃迈出了第一步！', 
          choices: [{ text: '激动鼓掌', icon: '👏', effect: { child: { mood: +15, health: +5, eq: +2 }, parent: { energy: -5 } } },
                   { text: '赶紧录下来', icon: '📱', effect: { child: { mood: +10, charm: +3 }, parent: { energy: -5 } } }] },
        { id: 'baby_laugh', title: '😊 开心大笑', desc: '宝宝被逗得咯咯笑，眼睛弯成月牙', 
          choices: [{ text: '继续逗TA', icon: '😄', effect: { child: { mood: +15, eq: +3 }, parent: { energy: -10 } } },
                   { text: '抱起来亲亲', icon: '❤️', effect: { child: { mood: +12, health: +3 }, parent: { energy: -5 } } }] },
        { id: 'baby_discover', title: '🔍 探索发现', desc: '宝宝对周围一切都充满好奇，在地上爬来爬去探索', 
          choices: [{ text: '买益智玩具', icon: '🧩', cost: 300, effect: { child: { iq: +5, mood: +8 }, parent: { money: -300 } } },
                   { text: '陪着一起探索', icon: '🤗', effect: { child: { iq: +3, eq: +3, mood: +5 }, parent: { energy: -10 } } }] },
        { id: 'baby_hug', title: '🤗 主动撒娇', desc: '宝宝张开小手要抱抱，奶声奶气叫了一声', 
          choices: [{ text: '立刻抱起来', icon: '🤱', effect: { child: { mood: +12, eq: +3 }, parent: { energy: -10 } } },
                   { text: '逗TA多叫几声', icon: '😄', effect: { child: { mood: +8, eq: +5 }, parent: { energy: -5 } } }] },
        { id: 'baby_sleep_well', title: '😇 睡整觉', desc: '宝宝今晚睡得特别香，一觉到天亮！', 
          choices: [{ text: '温馨守护', icon: '👼', effect: { child: { energy: +20, health: +5, mood: +5 }, parent: { energy: +15 } } },
                   { text: '轻轻亲一下', icon: '💋', effect: { child: { mood: +10, health: +3 }, parent: { energy: +5 } } }] },
        { id: 'baby_bathe', title: '🛁 洗澡时光', desc: '宝宝在澡盆里踢水，玩得特别开心', 
          choices: [{ text: '买可爱泳圈', icon: '🏊', cost: 200, effect: { child: { mood: +12, health: +8 }, parent: { money: -200 } } },
                   { text: '多陪玩一会', icon: '🧸', effect: { child: { mood: +10, health: +5, eq: +2 }, parent: { energy: -10 } } }] },
        { id: 'baby_read', title: '📖 亲子阅读', desc: '抱着宝宝读绘本，TA听得特别认真', 
          choices: [{ text: '每天坚持读', icon: '📚', effect: { child: { iq: +5, mood: +8, eq: +2 }, parent: { energy: -10 } } },
                   { text: '买更多绘本', icon: '💰', cost: 200, effect: { child: { iq: +8, mood: +5, academic: +3 }, parent: { money: -200 } } }] },
        { id: 'baby_photo', title: '📸 被拍照了', desc: '宝宝对着镜头露出无齿的笑容，太可爱了', 
          choices: [{ text: '发朋友圈', icon: '📱', effect: { child: { mood: +8, charm: +3 }, parent: { energy: -3 } } },
                   { text: '做成长相册', icon: '📒', cost: 150, effect: { child: { mood: +10, charm: +5 }, parent: { money: -150 } } }] },
        // ===== 更多正向事件 =====
        { id: 'baby_healthy', title: '💉 体检通过', desc: '宝宝去做体检，各项指标都很健康！', 
          choices: [{ text: '买营养品奖励', icon: '🥗', cost: 300, effect: { child: { health: +10, mood: +8 }, parent: { money: -300 } } },
                   { text: '夸奖宝宝真棒', icon: '👏', effect: { child: { mood: +8, health: +5 } } }] },
        { id: 'baby_appetite', title: '🍜 食欲大开', desc: '宝宝今天辅食吃得特别好，奶也喝得干干净净', 
          choices: [{ text: '多做一点', icon: '🍲', effect: { child: { health: +10, energy: +8 }, parent: { money: -100 } } },
                   { text: '夸TA是个小吃货', icon: '😋', effect: { child: { mood: +10, health: +5 } } }] },
        { id: 'baby_park', title: '🌳 公园散步', desc: '天气很好，抱着宝宝去公园晒太阳', 
          choices: [{ text: '买婴儿车遮阳棚', icon: '🛒', cost: 200, effect: { child: { mood: +12, health: +8 }, parent: { money: -200 } } },
                   { text: '陪TA看花草', icon: '🌺', effect: { child: { mood: +10, iq: +3 }, parent: { energy: -10 } } }] },
        { id: 'baby_bottle', title: '🍼 自己拿奶瓶', desc: '宝宝学会自己抱住奶瓶喝了，进步好大！', 
          choices: [{ text: '拍视频留念', icon: '📱', effect: { child: { mood: +10, discipline: +3 }, parent: { energy: -3 } } },
                   { text: '夸TA真聪明', icon: '⭐', effect: { child: { mood: +12, iq: +2 } } }] },
        { id: 'baby_wave', title: '👋 学会挥手', desc: '教宝宝再见，TA竟然学会了挥手！', 
          choices: [{ text: '录下来发家庭群', icon: '📱', effect: { child: { mood: +10, eq: +5 }, parent: { energy: -3 } } },
                   { text: '热情鼓掌表扬', icon: '👏', effect: { child: { mood: +12, eq: +3 } } }] },
        { id: 'baby_cute', title: '萌照拍摄', desc: '宝宝今天特别配合，拍了一组超萌的照片', 
          choices: [{ text: '洗出来挂墙上', icon: '🏠', cost: 200, effect: { child: { mood: +10, charm: +5 }, parent: { money: -200 } } },
                   { text: '做表情包', icon: '😄', effect: { child: { mood: +12, charm: +3 } } }] }
    ],
    kindergarten: [
        { id: 'share', title: '🤝 抢玩具', desc: '宝宝和同学抢玩具', 
          choices: [{ text: '教育分享', icon: '💬', effect: { child: { eq: +5, mood: -3 } } },
                   { text: '支持争取', icon: '💪', effect: { child: { discipline: -3, mood: +5 } } }] },
        { id: 'performance', title: '🎭 汇报演出', desc: '幼儿园有汇报演出', 
          choices: [{ text: '积极参加', icon: '⭐', cost: 500, effect: { child: { talent: +5, charm: +3 }, parent: { money: -500 } } },
                   { text: '不参加', icon: '❌', effect: { child: { mood: -5 } } }] },
        { id: 'no_eat', title: '🍚 不肯吃饭', desc: '宝宝挑食严重，什么都不吃', 
          choices: [{ text: '变着花样做', icon: '👨‍🍳', effect: { child: { health: +3, mood: +5 }, parent: { energy: -15 } } },
                   { text: '饿一顿', icon: '⏰', effect: { child: { health: -5, discipline: +3 } } }] },
        { id: 'teacher_praise', title: '👩‍🏫 老师表扬', desc: '老师夸宝宝聪明伶俐', 
          choices: [{ text: '奖励', icon: '🎁', cost: 300, effect: { child: { mood: +10, iq: +2 }, parent: { money: -300 } } },
                   { text: '鼓励继续努力', icon: '💬', effect: { child: { mood: +5, discipline: +3 } } }] },
        { id: 'lost', title: '😢 走丢了', desc: '接孩子时找不到人了！', 
          choices: [{ text: '紧急寻找', icon: '🏃', effect: { child: { mood: -10 }, parent: { energy: -30 } } },
                   { text: '冷静广播', icon: '📢', effect: { child: { mood: -5 }, parent: { energy: -15 } } }] },
        { id: 'nap_time', title: '😴 不肯午睡', desc: '午休时间TA精神百倍不睡觉', 
          choices: [{ text: '强制午睡', icon: '🛏️', effect: { child: { discipline: +3, mood: -5 } } },
                   { text: '让TA安静玩', icon: '🧸', effect: { child: { mood: +3, discipline: -2 } } }] },
        { id: 'birthday_party', title: '🎂 生日派对', desc: '同学生日邀请TA去参加', 
          choices: [{ text: '准备礼物去', icon: '🎁', cost: 200, effect: { child: { eq: +5, mood: +10 }, parent: { money: -200 } } },
                   { text: '婉拒不去', icon: '🙅', effect: { child: { mood: -5 } } }] },
        // ===== 新增正向事件 =====
        { id: 'best_friend', title: '👫 交到好朋友', desc: '宝宝在幼儿园有了第一个好朋友，每天都期待去学校', 
          choices: [{ text: '邀请来家玩', icon: '🏠', cost: 200, effect: { child: { eq: +8, mood: +12 }, parent: { money: -200, energy: -10 } } },
                   { text: '多聊聊学校的事', icon: '💬', effect: { child: { eq: +6, mood: +8 } } }] },
        { id: 'artwork', title: '🎨 画出大作', desc: '宝宝画了一幅特别有想象力的画，还得意地展示给家人看', 
          choices: [{ text: '裱起来展示', icon: '🏆', effect: { child: { talent: +8, mood: +12, discipline: +3 }, parent: { money: -100 } } },
                   { text: '夸TA是小毕加索', icon: '👏', effect: { child: { talent: +5, mood: +10, eq: +3 } } }] },
        { id: 'sing_song', title: '🎵 唱首歌', desc: '宝宝学会了一首新儿歌，奶声奶气地唱给家人听', 
          choices: [{ text: '一起合唱', icon: '🎤', effect: { child: { talent: +5, mood: +10, eq: +3 }, parent: { energy: -5 } } },
                   { text: '发家庭群分享', icon: '📱', effect: { child: { mood: +8, charm: +3 } } }] },
        { id: 'help_mom', title: '🏠 主动帮忙', desc: '宝宝今天主动帮妈妈收拾玩具，还说以后要当家务小能手', 
          choices: [{ text: '表扬奖励', icon: '⭐', effect: { child: { mood: +10, discipline: +5, eq: +3 }, parent: { energy: +5 } } },
                   { text: '一起做家务', icon: '👨‍👩‍👧', effect: { child: { eq: +5, discipline: +4, mood: +5 }, parent: { energy: -10 } } }] },
        { id: 'show_talent', title: '🌟 发现天赋', desc: '幼儿园老师发现宝宝在某个方面特别有天赋！', 
          choices: [{ text: '报相关兴趣班', icon: '🎯', cost: 1000, effect: { child: { talent: +12, mood: +8 }, parent: { money: -1000, energy: -10 } } },
                   { text: '在家重点培养', icon: '🏠', effect: { child: { talent: +6, mood: +5, discipline: +3 } } }] },
        { id: 'make_friends', title: '🤝 融入集体', desc: '宝宝从不爱说话变得主动和小朋友交流了', 
          choices: [{ text: '开派对庆祝', icon: '🎉', cost: 500, effect: { child: { eq: +10, mood: +12, charm: +3 }, parent: { money: -500 } } },
                   { text: '继续鼓励引导', icon: '💬', effect: { child: { eq: +8, mood: +8 } } }] },
        { id: 'good_eater', title: '🍜 吃饭进步', desc: '以前挑食的宝宝现在能好好吃饭了，身体也变壮了', 
          choices: [{ text: '多做营养餐', icon: '🥗', cost: 300, effect: { child: { health: +15, energy: +10, mood: +5 }, parent: { money: -300 } } },
                   { text: '表扬鼓励', icon: '👏', effect: { child: { health: +8, mood: +8, discipline: +3 } } }] }
    ],
    elementary: [
        { id: 'exam_cheat', title: '📝 作弊被抓', desc: '考试时偷看旁边同学', 
          choices: [{ text: '严肃批评', icon: '😠', effect: { child: { discipline: +10, mood: -20 } } },
                   { text: '问清原因', icon: '💬', effect: { child: { discipline: +5, eq: +5 } } }] },
        { id: 'classmate', title: '👥 同学矛盾', desc: '被同学排挤', 
          choices: [{ text: '教TA反抗', icon: '🥊', effect: { child: { discipline: -5, charm: +3 } } },
                   { text: '找老师', icon: '👨‍🏫', effect: { child: { eq: +5 } } }] },
        { id: 'lost_item', title: '📱 弄丢东西', desc: '新买的文具/手机不见了', 
          choices: [{ text: '再买一个', icon: '💰', cost: 1000, effect: { child: { mood: +5 }, parent: { money: -1000 } } },
                   { text: '让TA自己承担', icon: '📚', effect: { child: { mood: -15, discipline: +5 } } }] },
        { id: 'good_grade', title: '📊 考了好成绩', desc: '这次考试班级前三名！', 
          choices: [{ text: '大奖特奖', icon: '🎁', cost: 1000, effect: { child: { mood: +15, academic: +3 }, parent: { money: -1000 } } },
                   { text: '口头表扬', icon: '👍', effect: { child: { mood: +10 } } }] },
        { id: 'sick_leave', title: '😷 生病请假', desc: '发烧了，要请假在家', 
          choices: [{ text: '在家照顾', icon: '🏠', effect: { child: { health: +15, academic: -3 }, parent: { energy: -20 } } },
                   { text: '送托管班', icon: '🏫', cost: 500, effect: { child: { health: +10, mood: -5 }, parent: { money: -500 } } }] },
        { id: 'art_competition', title: '🎨 绘画比赛', desc: '学校举办绘画比赛，TA想参加', 
          choices: [{ text: '全力支持', icon: '🎨', cost: 800, effect: { child: { talent: +5, mood: +5 }, parent: { money: -800 } } },
                   { text: '学习要紧', icon: '📚', effect: { child: { academic: +3, mood: -5 } } }] },
        { id: 'sports_meet', title: '🏃 运动会选拔', desc: '体育老师看中TA参加校运会', 
          choices: [{ text: '鼓励参加', icon: '⚽', effect: { child: { health: +5, mood: +5 } } },
                   { text: '怕影响学习', icon: '📚', effect: { child: { academic: +3, mood: -5 } } }] },
        { id: 'class_leader', title: '👑 竞选班干部', desc: 'TA想竞选班长锻炼自己', 
          choices: [{ text: '支持竞选', icon: '👍', effect: { child: { eq: +5, charm: +3 } } },
                   { text: '专心学习', icon: '📚', effect: { child: { academic: +3, eq: -2 } } }] },
        { id: 'bully', title: '😭 被高年级欺负', desc: '放学路上被高年级学生勒索', 
          choices: [{ text: '找对方家长', icon: '💬', effect: { child: { mood: +5, eq: +3 } } },
                   { text: '报警处理', icon: '👮', effect: { child: { discipline: +5, mood: -5 } } },
                   { text: '让TA忍忍', icon: '🙈', effect: { child: { mood: -15, health: -5 } } }] },
        { id: 'field_trip', title: '🚌 春游活动', desc: '学校组织春游，要交200元', 
          choices: [{ text: '让TA参加', icon: '🚌', cost: 200, effect: { child: { mood: +10, eq: +3 }, parent: { money: -200 } } },
                   { text: '在家学习', icon: '📚', effect: { child: { academic: +3, mood: -10 } } }] },
        { id: 'pet_want', title: '🐶 想要宠物', desc: 'TA看到同学养了小狗，也想要一只', 
          choices: [{ text: '买一只', icon: '🐶', cost: 1500, effect: { child: { mood: +15, discipline: -3 }, parent: { money: -1500 } } },
                   { text: '太麻烦拒绝', icon: '🙅', effect: { child: { mood: -10 } } },
                   { text: '承诺考好买', icon: '📝', effect: { child: { academic: +5, mood: +3 } } }] },
        { id: 'late_homework', title: '😰 作业没写完', desc: '昨晚玩游戏，作业一个字没动', 
          choices: [{ text: '帮TA写', icon: '✏️', effect: { child: { mood: +5, discipline: -5 }, parent: { energy: -15 } } },
                   { text: '让TA自己承担', icon: '😤', effect: { child: { discipline: +5, mood: -10, academic: -2 } } }] },
        { id: 'invite_friend', title: '🏠 邀请同学来家', desc: 'TA想邀请同学来家里玩', 
          choices: [{ text: '热情招待', icon: '🍕', cost: 300, effect: { child: { eq: +5, mood: +10 }, parent: { money: -300 } } },
                   { text: '下次再说', icon: '🙅', effect: { child: { mood: -5 } } }] },
        { id: 'teacher_call', title: '📞 老师来电', desc: '班主任打电话说TA上课总走神', 
          choices: [{ text: '严肃批评', icon: '😠', effect: { child: { discipline: +8, mood: -15 } } },
                   { text: '耐心沟通', icon: '💬', effect: { child: { discipline: +3, mood: -5 } } }] },
        // ===== 新增正向事件 =====
        { id: 'perfect_score', title: '🏆 满分成绩', desc: '这次考试居然考了满分，全班震惊！', 
          choices: [{ text: '大摆庆功宴', icon: '🎉', cost: 800, effect: { child: { mood: +20, academic: +5, charm: +3 }, parent: { money: -800 } } },
                   { text: '激励继续努力', icon: '💪', effect: { child: { mood: +12, academic: +3, discipline: +3 } } }] },
        { id: 'science_fair', title: '🔬 科学展获奖', desc: 'TA的小发明在校园科学展上获得了奖项！', 
          choices: [{ text: '全力支持继续研究', icon: '💡', cost: 1000, effect: { child: { iq: +10, talent: +5, mood: +12 }, parent: { money: -1000 } } },
                   { text: '鼓励学业为重', icon: '📚', effect: { child: { academic: +5, mood: +5 } } }] },
        { id: 'reading_bug', title: '📚 爱上阅读', desc: 'TA迷上了阅读，每天写完作业就抱着书看', 
          choices: [{ text: '买更多好书', icon: '📖', cost: 400, effect: { child: { iq: +8, academic: +8, mood: +8 }, parent: { money: -400 } } },
                   { text: '陪TA一起读', icon: '🤗', effect: { child: { iq: +6, eq: +4, mood: +6 } } }] },
        { id: 'best_disciplined', title: '📏 自律标兵', desc: 'TA这学期每天自觉完成作业，还主动预习复习', 
          choices: [{ text: '奖励旅游', icon: '✈️', cost: 3000, effect: { child: { mood: +15, discipline: +10, eq: +3 }, parent: { money: -3000 } } },
                   { text: '精神表扬', icon: '🏅', effect: { child: { mood: +10, discipline: +8 } } }] },
        { id: 'sports_champion', title: '🏃 运动会冠军', desc: 'TA在校运会某个项目夺得了第一名！', 
          choices: [{ text: '庆祝一番', icon: '🎉', cost: 500, effect: { child: { health: +10, mood: +15, charm: +5 }, parent: { money: -500 } } },
                   { text: '加入校队', icon: '⚽', effect: { child: { health: +8, talent: +5, mood: +10, eq: +3 } } }] },
        { id: 'volunteer', title: '❤️ 爱心公益', desc: '学校组织公益活动，TA积极报名参加', 
          choices: [{ text: '全力支持', icon: '👍', effect: { child: { eq: +10, mood: +10, discipline: +3 }, parent: { money: -200 } } },
                   { text: '一起去参加', icon: '👨‍👩‍👧', effect: { child: { eq: +8, mood: +8, discipline: +5 }, parent: { energy: -15 } } }] },
        { id: 'hometown_hero', title: '🌟 为校争光', desc: 'TA代表学校参加比赛并获得奖项，为班级争光', 
          choices: [{ text: '开表彰会', icon: '🏆', cost: 600, effect: { child: { mood: +18, charm: +8, discipline: +5 }, parent: { money: -600 } } },
                   { text: '私下鼓励', icon: '💬', effect: { child: { mood: +12, discipline: +5 } } }] },
        { id: 'growth_spurt', title: '📈 快速成长期', desc: 'TA突然长高了一大截，身体也越来越结实', 
          choices: [{ text: '加强营养', icon: '🥩', cost: 500, effect: { child: { health: +15, energy: +10, mood: +5 }, parent: { money: -500 } } },
                   { text: '报运动班', icon: '⚽', cost: 1000, effect: { child: { health: +12, energy: +8, mood: +5 }, parent: { money: -1000 } } }] }
    ],
    middle: [
        { id: 'game_addict', title: '🎮 游戏成瘾', desc: '偷偷玩手机被发现', 
          choices: [{ text: '没收手机', icon: '📱', effect: { child: { discipline: +10, mood: -30 } } },
                   { text: '限时玩', icon: '⏰', effect: { child: { discipline: +5, mood: -10 } } }] },
        { id: 'idol', title: '🤩 追星', desc: '疯狂迷恋某个明星', 
          choices: [{ text: '支持理解', icon: '👍', effect: { child: { mood: +15, academic: -5 } } },
                   { text: '严厉禁止', icon: '🚫', effect: { child: { mood: -25, discipline: -5 } } }] },
        { id: 'netbar', title: '🖥️ 去网吧', desc: '发现TA偷偷去网吧', 
          choices: [{ text: '严厉批评', icon: '😠', effect: { child: { discipline: +10, mood: -20 } } },
                   { text: '家里买电脑', icon: '💻', cost: 8000, effect: { child: { mood: +10, discipline: -5 }, parent: { money: -8000 } } }] },
        { id: 'expel_rumor', title: '😨 开除谣言', desc: '听说学校要开除差生', 
          choices: [{ text: '找关系疏通', icon: '💰', cost: 5000, effect: { child: { mood: +5 }, parent: { money: -5000 } } },
                   { text: '让TA好好表现', icon: '📚', effect: { child: { discipline: +5, mood: -5 } } }] },
        { id: 'science_award', title: '🏆 科技竞赛', desc: '有机会参加科技创新大赛', 
          choices: [{ text: '全力支持', icon: '🔬', cost: 3000, effect: { child: { iq: +5, academic: +5, talent: +3 }, parent: { money: -3000 } } },
                   { text: '专心学习', icon: '📚', effect: { child: { academic: +3 } } }] },
        { id: 'music_contest', title: '🎵 校园歌手大赛', desc: 'TA想参加校园歌手比赛', 
          choices: [{ text: '支持参加', icon: '🎵', cost: 1000, effect: { child: { talent: +8, charm: +5, mood: +10 }, parent: { money: -1000 } } },
                   { text: '影响学习', icon: '📚', effect: { child: { academic: +3, mood: -10 } } }] },
        { id: 'sports_team', title: '⚽ 校队选拔', desc: '体育老师邀请加入校队', 
          choices: [{ text: '同意加入', icon: '⚽', effect: { child: { health: +8, energy: +5, academic: -3 } } },
                   { text: '专心学习', icon: '📚', effect: { child: { academic: +5, mood: -5 } } }] },
        { id: 'live_stream', title: '📱 想做主播', desc: 'TA想尝试做游戏主播', 
          choices: [{ text: '买设备支持', icon: '📱', cost: 5000, effect: { child: { charm: +8, talent: +5, academic: -5 }, parent: { money: -5000 } } },
                   { text: '坚决阻止', icon: '🚫', effect: { child: { mood: -20, discipline: +5 } } },
                   { text: '限时尝试', icon: '⏰', effect: { child: { charm: +3, academic: -2 } } }] },
        { id: 'first_love', title: '💕 收到情书', desc: 'TA收到同学的情书', 
          choices: [{ text: '理性引导', icon: '💬', effect: { child: { eq: +5, mood: +5 } } },
                   { text: '禁止早恋', icon: '🚫', effect: { child: { mood: -15, discipline: +3 } } }] },
        { id: 'private_tutor_random', title: '👨‍🏫 金牌私教', desc: '听说有位退休特级教师在家做家教', 
          choices: [{ text: '💎 聘请（15万/年）', icon: '👨‍🏫', cost: 150000, effect: { child: { iq: +15, academic: +20, discipline: +10 } }, log: '金牌私教效果显著，孩子进步神速！' },
                   { text: '📚 自学即可', icon: '📚', effect: { child: { discipline: +3 } }, log: '决定依靠学校教育。' }] }
    ],
    high: [
        { id: 'pressure', title: '😰 压力山大', desc: '高考压力让TA喘不过气', 
          choices: [{ text: '心理疏导', icon: '🧘', effect: { child: { mood: +20, academic: +3 } } },
                   { text: '继续施压', icon: '📚', effect: { child: { academic: +5, health: -15, mood: -20 } } }] },
        { id: 'future', title: '🎓 未来迷茫', desc: '不知道选什么专业', 
          choices: [{ text: '建议热门', icon: '💼', effect: { child: { academic: +5, mood: -5 } } },
                   { text: '让TA选择', icon: '❤️', effect: { child: { mood: +10, discipline: +5 } } }] },
        { id: 'mock_exam', title: '📊 模拟考失利', desc: '一模成绩不理想，情绪低落', 
          choices: [{ text: '鼓励打气', icon: '💪', effect: { child: { mood: +15, academic: +3 } } },
                   { text: '加报补习班', icon: '💰', cost: 5000, effect: { child: { academic: +8, mood: +5 }, parent: { money: -5000 } } }] },
        { id: 'physical_exam', title: '🏃 体检不达标', desc: '高考体检发现视力/体重问题', 
          choices: [{ text: '治疗矫正', icon: '🏥', cost: 3000, effect: { child: { health: +15 }, parent: { money: -3000 } } },
                   { text: '顺其自然', icon: '😐', effect: { child: { health: -5 } } }] },
        { id: 'volunteer', title: '❤️ 志愿活动', desc: '学校组织去养老院做义工', 
          choices: [{ text: '支持参加', icon: '👍', effect: { child: { eq: +5, mood: +5, academic: -2 } } },
                   { text: '专注学习', icon: '📚', effect: { child: { academic: +3, eq: -2 } } }] },
        { id: 'art_exam', title: '🎨 艺考报名', desc: 'TA想报名艺考走艺术路线', 
          choices: [{ text: '全力支持', icon: '🎨', cost: 10000, effect: { child: { talent: +15, mood: +10 }, parent: { money: -10000 } } },
                   { text: '不建议', icon: '📚', effect: { child: { academic: +5, mood: -15 } } }] },
        { id: 'sports_recruit', title: '⚡ 体育特招', desc: '有机会通过体育特招进名校', 
          choices: [{ text: '专业训练', icon: '⚽', cost: 8000, effect: { child: { health: +15, talent: +8 }, parent: { money: -8000 } } },
                   { text: '正常高考', icon: '📚', effect: { child: { academic: +5 } } }] },
        { id: 'viral_video', title: '📱 视频爆红', desc: 'TA拍的短视频意外爆红网络', 
          choices: [{ text: '支持运营', icon: '📱', cost: 5000, effect: { child: { charm: +15, talent: +10, academic: -5 }, parent: { money: -5000 } } },
                   { text: '低调处理', icon: '🔇', effect: { child: { charm: +5, academic: +3 } } },
                   { text: '删除视频', icon: '🗑️', effect: { child: { mood: -20 } } }] },
        { id: 'talent_scout', title: '🎭 星探发现', desc: '有经纪公司看中TA想签约', 
          choices: [{ text: '签约培养', icon: '⭐', cost: 20000, effect: { child: { charm: +20, talent: +15, academic: -10 }, parent: { money: -20000 } } },
                   { text: '拒绝签约', icon: '📚', effect: { child: { mood: -10, discipline: +5 } } }] }
    ]
};

// ==================== 自由行动选项 ====================
const FREE_ACTIONS = {
    baby: [
        { text: '🍼 喂奶', icon: '🍼', baseEffect: { child: { mood: +1, health: +1 } }, scaleWith: {}, cost: 0, energyCost: 5 },
        { text: '🧸 陪玩', icon: '🧸', baseEffect: { child: { mood: +2, iq: +1 } }, scaleWith: { iq: 0.1 }, cost: 0, energyCost: 10 },
        { text: '📺 放动画', icon: '📺', baseEffect: { child: { mood: +1 } }, scaleWith: {}, cost: 0, energyCost: 0 },
        { text: '😴 哄睡', icon: '😴', baseEffect: { child: { energy: +20 } }, scaleWith: { discipline: 0.1 }, cost: 0, energyCost: 5 },
        { text: '🚶 散步', icon: '🚶', baseEffect: { child: { mood: +1, health: +1 } }, scaleWith: { health: 0.1 }, cost: 0, energyCost: 8 }
    ],
    kindergarten: [
        { text: '🏫 送幼儿园', icon: '🏫', baseEffect: { child: { iq: +1, eq: +1, mood: -1 } }, scaleWith: { eq: 0.05 }, cost: 0, energyCost: 5 },
        { text: '🎨 兴趣班', icon: '🎨', baseEffect: { child: { talent: +1, mood: +1 } }, scaleWith: { talent: 0.12 }, cost: 800, energyCost: 12 },
        { text: '🏠 在家陪', icon: '🏠', baseEffect: { child: { mood: +1 } }, scaleWith: {}, cost: 0, energyCost: 8 }
    ],
    elementary: [
        { text: '📚 督促学习', icon: '📚', baseEffect: { child: { iq: +1, academic: +1, mood: -3 } }, scaleWith: { iq: 0.08, discipline: 0.04 }, cost: 0, energyCost: 15 },
        { text: '🎮 玩游戏', icon: '🎮', baseEffect: { child: { mood: +2, academic: -3 } }, scaleWith: { discipline: -0.08 }, cost: 0, energyCost: 5 },
        { text: '🎨 才艺课', icon: '🎨', baseEffect: { child: { talent: +1, mood: +1 } }, scaleWith: { talent: 0.15 }, cost: 1000, energyCost: 12 },
        { text: '⚽ 运动', icon: '⚽', baseEffect: { child: { health: +2, energy: +5, mood: +1 } }, scaleWith: { health: 0.08 }, cost: 0, energyCost: 15 },
        { text: '👥 社交', icon: '👥', baseEffect: { child: { eq: +1, charm: +1 } }, scaleWith: { eq: 0.08, charm: 0.08 }, cost: 300, energyCost: 10 }
    ],
    middle: [
        { text: '📚 学习冲刺', icon: '📚', baseEffect: { child: { iq: +2, academic: +2, mood: -4, health: -2 } }, scaleWith: { iq: 0.1, discipline: 0.06 }, cost: 0, energyCost: 20 },
        { text: '👨‍🏫 请家教', icon: '👨‍🏫', baseEffect: { child: { iq: +2, academic: +3, mood: -3 } }, scaleWith: { iq: 0.12 }, cost: 2000, energyCost: 15 },
        { text: '🎮 放松玩', icon: '🎮', baseEffect: { child: { mood: +2 } }, scaleWith: { discipline: -0.12 }, cost: 0, energyCost: 5 },
        { text: '🏃 运动减压', icon: '🏃', baseEffect: { child: { health: +2, mood: +1 } }, scaleWith: { health: 0.1 }, cost: 0, energyCost: 18 },
        { text: '🎵 音乐培训', icon: '🎵', baseEffect: { child: { talent: +2, mood: +1 } }, scaleWith: { talent: 0.15 }, cost: 1500, energyCost: 12 },
        { text: '📱 直播尝试', icon: '📱', baseEffect: { child: { charm: +2, mood: +2, academic: -2 } }, scaleWith: { charm: 0.1 }, cost: 0, energyCost: 8 }
    ],
    high: [
        { text: '🔥 全力冲刺', icon: '🔥', baseEffect: { child: { iq: +2, academic: +4, health: -4, mood: -4 } }, scaleWith: { iq: 0.12, discipline: 0.08 }, cost: 0, energyCost: 30 },
        { text: '👨‍🏫 名师辅导', icon: '👨‍🏫', baseEffect: { child: { iq: +3, academic: +5, mood: -3 } }, scaleWith: { iq: 0.15 }, cost: 5000, energyCost: 20 },
        { text: '😴 休息调整', icon: '😴', baseEffect: { child: { mood: +4, health: +2, energy: +25 } }, scaleWith: { health: 0.08 }, cost: 0, energyCost: 0 },
        { text: '🎨 艺术突击', icon: '🎨', baseEffect: { child: { talent: +3, mood: +1 } }, scaleWith: { talent: 0.2 }, cost: 3000, energyCost: 18 },
        { text: '🏃 体育特训', icon: '🏃', baseEffect: { child: { health: +3, energy: +5, mood: -1 } }, scaleWith: { health: 0.12 }, cost: 2000, energyCost: 25 },
        { text: '📱 网红运营', icon: '📱', baseEffect: { child: { charm: +3, eq: +2, academic: -3 } }, scaleWith: { charm: 0.15 }, cost: 1000, energyCost: 10 },
        { text: '🎭 艺考准备', icon: '🎭', baseEffect: { child: { talent: +4, mood: -2 } }, scaleWith: { talent: 0.2 }, cost: 5000, energyCost: 20 }
    ]
};

// ==================== 结局判定系统 ====================
function calculateEnding(state) {
    const c = state.child;
    const endings = [];
    
    // 1. 学术路线（高考）- 难度提升，系数降低
    const score = Math.min(750, Math.floor(
        c.iq * 2 + c.academic * 1.5 + c.discipline * 0.5 + Math.random() * 30
    ));
    
    let academicEnding = { route: 'academic', score };
    if (score >= 720) academicEnding.result = '🏆 清华北大，光宗耀祖！';
    else if (score >= 680) academicEnding.result = '🥇 985名校，前途无量';
    else if (score >= 620) academicEnding.result = '🥈 211大学，稳扎稳打';
    else if (score >= 580) academicEnding.result = '📚 普通一本，继续努力';
    else if (score >= 450) academicEnding.result = '📖 二本院校，另辟蹊径';
    else academicEnding.result = '😅 高考失利，人生还有别的路';
    endings.push(academicEnding);
    
    // 2. 艺术路线
    if (c.talent > 70) {
        endings.push({
            route: 'art',
            result: c.talent > 85 ? '🎨 考入顶尖艺术院校，成为艺术家' : '🎭 艺术特长生，才艺出众'
        });
    }
    
    // 3. 体育路线
    if (c.health > 75 && c.energy > 75) {
        endings.push({
            route: 'sports',
            result: c.health > 85 ? '⚡ 体育特招，国家队苗子' : '🏃 体育特长生，身体强健'
        });
    }
    
    // 4. 社交/网红路线
    if (c.charm > 75 && c.eq > 60) {
        endings.push({
            route: 'social',
            result: c.charm > 85 ? '📱 成为网红/明星，粉丝百万' : '👥 人脉广泛，社交达人'
        });
    }
    
    // 5. 富二代路线（需要大量金钱+高属性）
    if (state.parent.money > 200000 && (c.iq > 70 || c.academic > 60 || c.talent > 70)) {
        endings.push({ 
            route: 'rich2nd', 
            result: '💰 富二代精英，继承家业/出国留学，人生赢家！',
            priority: 90 // 高优先级
        });
    } else if (state.parent.money > 150000) {
        endings.push({ 
            route: 'rich2nd', 
            result: '💰 富二代败家子，有钱但不成器',
            priority: 85
        });
    }
    
    // 6. 中产舒适路线
    if (state.parent.money > 80000 && state.parent.money <= 150000 && c.academic > 40) {
        endings.push({ 
            route: 'middle_class', 
            result: '🏡 中产家庭，生活安稳，幸福美满' 
        });
    }
    
    // 7. 特殊结局
    if (c.health < 20) {
        endings.push({ route: 'health', result: '😷 身体垮了，休学养病' });
    }
    if (c.mood < 15) {
        endings.push({ route: 'mental', result: '💔 心理问题严重，需要长期治疗' });
    }
    if (c.discipline < 20 && c.academic < 30) {
        endings.push({ route: 'rebel', result: '😤 彻底叛逆，离家出走' });
    }
    
    // 选择最佳结局（根据最高属性或金钱）
    const bestRoute = determineBestRoute(c, state.parent.money);
    const mainEnding = endings.find(e => e.route === bestRoute) || endings[0];
    
    return { endings, mainEnding, bestRoute };
}

function determineBestRoute(child, money) {
    // 如果金钱超过15万，优先判定为富二代路线
    if (money > 150000) {
        return 'rich2nd';
    }
    
    const scores = {
        academic: child.iq * 2 + child.academic * 2 + child.discipline,
        art: child.talent * 3 + child.charm,
        sports: child.health * 2 + child.energy * 2,
        social: child.charm * 2 + child.eq * 2,
        internet: child.charm * 3
    };
    
    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
}

// ==================== 游戏状态类 ====================
class GameState {
    constructor() {
        this.turn = 0;
        this.pendingEvent = null;
        this.traits = generateTraits();
        this.prevStageName = null; // 用于检测阶段变化
        
        this.parent = {
            energy: 100,
            money: 5000
        };
        
        this.child = {
            name: '小宝',
            mood: 80,
            health: 100,
            energy: 100,
            iq: 50,
            eq: 50,
            talent: 0,
            charm: 50,
            discipline: 50,
            academic: 0
        };
        
        this.applyTraits();
        this.logs = [];
    }
    
    applyTraits() {
        // 天生词条只影响这些属性，不影响健康/体力/情绪
        const allowedTraits = ['iq', 'eq', 'talent', 'charm', 'discipline', 'academic'];
        
        this.traits.forEach(trait => {
            if (trait.effect) {
                Object.keys(trait.effect).forEach(key => {
                    // 只应用允许的属性，不影响健康/体力/情绪
                    if (allowedTraits.includes(key)) {
                        this.child[key] = Math.max(0, this.child[key] + trait.effect[key]);
                    }
                });
            }
        });
    }
    
    getStage() {
        for (let stage of CONFIG.STAGES) {
            if (this.turn >= stage.start && this.turn < stage.end) {
                return stage;
            }
        }
        return CONFIG.STAGES[4];
    }
    
    getAgeText() {
        // 修复：48回合对应18年（每回合约0.375年，4.5个月）
        const totalMonths = Math.floor(this.turn * 4.5);
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        if (years === 0) return `${months}个月`;
        return `${years}岁${months > 0 ? months + '个月' : ''}`;
    }
}

// ==================== 游戏主类 ====================
class Game {
    constructor() {
        this.state = new GameState();
        this.initUI();
    }
    
    initUI() {
        this.ui = {
            startScreen: document.getElementById('startScreen'),
            gameScreen: document.getElementById('gameScreen'),
            endScreen: document.getElementById('endScreen')
        };
    }
    
    start() {
        let name = prompt('给宝宝起个名字（最多6个字）：', '小宝');
        if (name) {
            name = name.trim().substring(0, 6);
            this.state.child.name = name;
        }
        
        this.ui.startScreen.style.display = 'none';
        this.ui.gameScreen.style.display = 'block';
        
        // 初始化当前阶段
        this.state.prevStageName = this.state.getStage().name;
        
        this.displayTraits();
        this.addLog(`${this.state.child.name}出生了！`);
        this.state.traits.forEach(t => this.addLog(`✨ ${t.name}: ${t.desc}`));
        
        this.startTurn();
    }
    
    displayTraits() {
        document.getElementById('babyName').textContent = this.state.child.name;
        const container = document.createElement('div');
        container.style.cssText = 'margin-top: 10px; display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;';
        
        this.state.traits.forEach(trait => {
            const tag = document.createElement('span');
            tag.style.cssText = `padding: 4px 10px; border-radius: 12px; font-size: 11px; background: ${trait.color}20; color: ${trait.color}; border: 1px solid ${trait.color}40; cursor: help; position: relative;`;
            tag.textContent = trait.name;
            
            // 创建提示框
            const tooltip = document.createElement('div');
            tooltip.style.cssText = `
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 100;
                margin-bottom: 5px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s;
                pointer-events: none;
            `;
            tooltip.innerHTML = `<strong>${trait.name}</strong><br/>${trait.desc}<br/><span style="color: #aaa; font-size: 11px;">点击查看详情</span>`;
            
            tag.appendChild(tooltip);
            
            // 鼠标悬停显示
            tag.onmouseenter = () => {
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
            };
            tag.onmouseleave = () => {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            };
            
            // 点击显示详细效果
            tag.onclick = () => {
                const effectText = Object.entries(trait.effect || {}).map(([k, v]) => {
                    const labels = { iq: '智商', eq: '情商', talent: '才艺', charm: '魅力', health: '健康', energy: '体力', mood: '情绪', discipline: '自律', academic: '学业' };
                    return `${labels[k] || k}: ${v > 0 ? '+' : ''}${v}`;
                }).join(', ');
                alert(`${trait.name}\n${trait.desc}\n\n效果: ${effectText}`);
            };
            
            container.appendChild(tag);
        });
        
        const babySection = document.querySelector('.baby-section');
        const existing = babySection.querySelector('#traitsContainer');
        if (existing) existing.remove();
        container.id = 'traitsContainer';
        babySection.appendChild(container);
    }
    
    startTurn() {
        if (this.state.turn >= CONFIG.TOTAL_TURNS) {
            this.endGame();
            return;
        }
        
        const stage = this.state.getStage();
        const prevStageName = this.state.prevStageName;
        
        // 先检查条件事件（在恢复之前，确保能触发危机事件）
        const conditionEvent = getConditionalEvent(this.state);
        
        // 然后自然恢复
        this.naturalRecovery();
        
        // 检查是否进入了新阶段
        if (prevStageName && prevStageName !== stage.name) {
            this.showStageUpAchievement(prevStageName, stage);
            return;
        }
        
        if (conditionEvent) {
            // 有条件事件，优先处理
            this.showEvent(conditionEvent, true);
        } else if (Math.random() < stage.eventChance) {
            // 随机事件（各阶段概率不同）
            const pool = RANDOM_EVENTS[Object.keys(RANDOM_EVENTS).find(k => {
                if (stage.name === '婴儿期') return k === 'baby';
                if (stage.name === '幼儿园') return k === 'kindergarten';
                if (stage.name === '小学') return k === 'elementary';
                if (stage.name === '初中') return k === 'middle';
                if (stage.name === '高中') return k === 'high';
            })] || [];
            
            if (pool.length > 0) {
                const event = pool[Math.floor(Math.random() * pool.length)];
                this.showEvent(event, false);
            } else {
                this.showFreeActions();
            }
        } else {
            // 无事件，自由行动
            this.showFreeActions();
        }
    }
    
    showStageUpAchievement(prevStage, newStage) {
        const stageNames = { '婴儿期': '👶', '幼儿园': '🧒', '小学': '👦', '初中': '🎒', '高中': '📚' };
        const emoji = stageNames[newStage.name] || '⭐';
        
        const title = document.getElementById('eventTitle');
        const desc = document.getElementById('eventDesc');
        
        title.textContent = `🎉 恭喜！${newStage.name}啦！`;
        title.style.color = '#FFD700';
        
        // 生成本阶段数据总结
        const summary = `
            <div style="text-align:left; margin: 15px 0;">
                <div style="margin-bottom: 10px;">${emoji} <strong>${this.state.child.name}</strong> 进入了 <strong>${newStage.name}</strong>！</div>
                <div style="font-size: 13px; color: #666; line-height: 1.8;">
                    <div>📊 当前学业: ${this.state.child.academic}</div>
                    <div>🧠 智商: ${this.state.child.iq} | 💬 情商: ${this.state.child.eq}</div>
                    <div>✨ 魅力: ${this.state.child.charm} | 🎨 才艺: ${this.state.child.talent}</div>
                    <div>❤️ 健康: ${this.state.child.health} | 😊 情绪: ${this.state.child.mood}</div>
                    <div>💰 家庭资产: ¥${this.state.parent.money.toLocaleString()}</div>
                </div>
            </div>
        `;
        desc.innerHTML = summary;
        
        // 解锁路线提示
        let routeHint = '';
        if (this.state.child.talent > 50) routeHint += '🎨 艺术路线已解锁<br>';
        if (this.state.child.charm > 50 && this.state.child.eq > 50) routeHint += '📱 社交路线已解锁<br>';
        if (this.state.child.health > 60 && this.state.child.energy > 60) routeHint += '⚡ 体育路线已解锁<br>';
        if (this.state.child.iq > 60) routeHint += '🧠 学术路线已解锁<br>';
        
        if (routeHint) {
            desc.innerHTML += `<div style="font-size: 12px; color: #9b59b6; margin-top: 10px; padding: 8px; background: rgba(155,89,182,0.1); border-radius: 8px;"><strong>🌟 已解锁路线：</strong><br>${routeHint}</div>`;
        }
        
        const choicesBox = document.getElementById('choicesBox');
        choicesBox.innerHTML = '';
        
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
        btn.innerHTML = `
            <span class="choice-icon">${emoji}</span>
            <div style="flex:1; text-align:left">
                <div>继续成长之路</div>
                <div style="font-size:11px;opacity:0.8;margin-top:2px">进入${newStage.name}，迎接新的挑战！</div>
            </div>
        `;
        btn.onclick = () => {
            this.state.prevStageName = newStage.name;
            this.state.turn++;
            this.addLog(`🎉 ${this.state.child.name}进入了${newStage.name}！`);
            this.addLog(`💰 工资收入 +¥${newStage.income}`);
            this.updateUI();
            
            // 更新阶段显示
            document.getElementById('stageDisplay').textContent = newStage.name;
            document.getElementById('babyAvatar').textContent = newStage.emoji;
            
            setTimeout(() => this.startTurn(), 500);
        };
        choicesBox.appendChild(btn);
    }
    
    naturalRecovery() {
        const stage = this.state.getStage();
        this.state.parent.money += stage.income;
        this.state.parent.energy = Math.min(100, this.state.parent.energy + 5);
        this.state.child.energy = Math.min(100, this.state.child.energy + 3);
        
        // 数值平衡：适度自然恢复
        // 健康只有在很低时才缓慢恢复
        if (this.state.child.health < 30) this.state.child.health += 1;
        // 情绪自然恢复提高容错
        if (this.state.child.mood < 40) this.state.child.mood += 2;
        
        // 只有极高学业压力才损耗健康
        if (this.state.child.academic > 80) {
            this.state.child.health -= 1;
            this.state.child.mood -= 1;
        }
        
        this.updateUI();
    }
    
    showEvent(event, isCondition) {
        const title = document.getElementById('eventTitle');
        const desc = document.getElementById('eventDesc');
        
        title.textContent = (isCondition ? '⚠️ ' : '🎲 ') + event.title;
        title.style.color = isCondition ? '#e74c3c' : '#667eea';
        desc.textContent = event.desc;
        
        const choicesBox = document.getElementById('choicesBox');
        choicesBox.innerHTML = '';
        
        event.choices.forEach((choice, i) => {
            const btn = document.createElement('button');
            const hasMoney = !choice.cost || this.state.parent.money >= choice.cost;
            const isDisabled = !hasMoney;
            
            btn.className = 'choice-btn';
            if (isDisabled) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.style.background = '#999';
            } else {
                btn.style.background = isCondition ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : 'linear-gradient(135deg, #667eea, #764ba2)';
            }
            
            // 显示事件选项效果
            const effectText = this.formatEventEffect(choice.effect);
            const costText = choice.cost ? ` (-¥${choice.cost})` : '';
            const disabledText = isDisabled ? ' (金钱不足)' : '';
            
            btn.innerHTML = `
                <span class="choice-icon">${choice.icon}</span>
                <div style="flex:1; text-align:left">
                    <div>${choice.text}${costText}${disabledText}</div>
                    ${effectText ? `<div style="font-size:11px;opacity:0.8;margin-top:2px">${effectText}</div>` : ''}
                </div>
            `;
            
            if (!isDisabled) {
                btn.onclick = () => this.handleEventChoice(choice, event.title);
            }
            setTimeout(() => choicesBox.appendChild(btn), i * 100);
        });
    }
    
    formatEventEffect(effect) {
        if (!effect) return '';
        const parts = [];
        
        if (effect.child) {
            if (effect.child.iq) parts.push(`${effect.child.iq > 0 ? '+' : ''}${effect.child.iq}智商`);
            if (effect.child.academic) parts.push(`${effect.child.academic > 0 ? '+' : ''}${effect.child.academic}学业`);
            if (effect.child.talent) parts.push(`${effect.child.talent > 0 ? '+' : ''}${effect.child.talent}才艺`);
            if (effect.child.eq) parts.push(`${effect.child.eq > 0 ? '+' : ''}${effect.child.eq}情商`);
            if (effect.child.health) parts.push(`${effect.child.health > 0 ? '+' : ''}${effect.child.health}健康`);
            if (effect.child.mood) parts.push(`${effect.child.mood > 0 ? '+' : ''}${effect.child.mood}情绪`);
            if (effect.child.energy) parts.push(`${effect.child.energy > 0 ? '+' : ''}${effect.child.energy}体力`);
            if (effect.child.discipline) parts.push(`${effect.child.discipline > 0 ? '+' : ''}${effect.child.discipline}自律`);
            if (effect.child.charm) parts.push(`${effect.child.charm > 0 ? '+' : ''}${effect.child.charm}魅力`);
        }
        
        if (effect.parent) {
            if (effect.parent.energy) parts.push(`${effect.parent.energy > 0 ? '+' : ''}${effect.parent.energy}家长体力`);
            if (effect.parent.money) parts.push(`${effect.parent.money > 0 ? '+' : ''}${effect.parent.money}金钱`);
        }
        
        return parts.join(' · ');
    }
    
    showFreeActions() {
        const stage = this.state.getStage();
        const actions = FREE_ACTIONS[Object.keys(FREE_ACTIONS).find(k => {
            if (stage.name === '婴儿期') return k === 'baby';
            if (stage.name === '幼儿园') return k === 'kindergarten';
            if (stage.name === '小学') return k === 'elementary';
            if (stage.name === '初中') return k === 'middle';
            if (stage.name === '高中') return k === 'high';
        })] || [];
        
        document.getElementById('eventTitle').textContent = `第${this.state.turn + 1}回合 · 自由行动`;
        document.getElementById('eventTitle').style.color = '#667eea';
        document.getElementById('eventDesc').textContent = `本回合你打算让${this.state.child.name}做什么？`;
        
        const choicesBox = document.getElementById('choicesBox');
        choicesBox.innerHTML = '';
        
        // 检查是否有可执行的选项
        let hasAvailableAction = false;
        
        actions.forEach((action, i) => {
            const btn = document.createElement('button');
            // 修复：energyCost为0时不能用 || 10，因为0是falsy
            const energyCost = action.energyCost !== undefined ? action.energyCost : 10;
            const hasEnergy = this.state.child.energy >= energyCost;
            const hasMoney = !action.cost || this.state.parent.money >= action.cost;
            const isDisabled = !hasEnergy || !hasMoney;
            
            if (!isDisabled) hasAvailableAction = true;
            
            btn.className = 'choice-btn';
            if (isDisabled) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.style.background = '#999';
            }
            
            const effectText = this.formatEffect(action);
            const costText = action.cost ? ` (-¥${action.cost})` : '';
            let disabledText = '';
            if (!hasEnergy) disabledText = ' (体力不足)';
            else if (!hasMoney) disabledText = ' (金钱不足)';
            
            btn.innerHTML = `
                <span class="choice-icon">${action.icon}</span>
                <div style="flex:1; text-align:left">
                    <div>${action.text}${costText}${disabledText}</div>
                    ${effectText ? `<div style="font-size:11px;opacity:0.8;margin-top:2px">${effectText}</div>` : ''}
                </div>
            `;
            
            if (!isDisabled) {
                btn.onclick = () => this.handleFreeAction(action);
            }
            setTimeout(() => choicesBox.appendChild(btn), i * 100);
        });
        
        // 保底机制：如果没有可执行的选项（体力不足），显示强制休息
        if (!hasAvailableAction) {
            const restBtn = document.createElement('button');
            restBtn.className = 'choice-btn';
            restBtn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
            restBtn.innerHTML = `
                <span class="choice-icon">😴</span>
                <div style="flex:1; text-align:left">
                    <div>💤 强制休息（体力耗尽）</div>
                    <div style="font-size:11px;opacity:0.8;margin-top:2px">体力+50 · 回合正常推进</div>
                </div>
            `;
            restBtn.onclick = () => this.handleForcedRest();
            choicesBox.appendChild(restBtn);
        }
    }
    
    handleForcedRest() {
        // 强制休息恢复体力
        this.state.child.energy = Math.min(100, this.state.child.energy + 50);
        this.state.child.mood = Math.min(100, this.state.child.mood + 10);
        this.addLog('😴 体力耗尽，强制休息恢复！');
        this.addLog(`💰 工资收入 +¥${this.state.getStage().income}`);
        
        this.state.turn++;
        this.updateUI();
        
        setTimeout(() => this.startTurn(), 500);
    }
    
    handleEventChoice(choice, eventTitle) {
        if (choice.cost && this.state.parent.money < choice.cost) {
            this.addLog('💸 金钱不足！');
            return;
        }
        
        // 先扣除金钱，确保UI及时更新
        if (choice.cost) {
            this.state.parent.money -= choice.cost;
            this.updateUI();
        }
        
        this.applyEffect(choice.effect);
        
        // 修复：如果没有log，使用默认日志
        const logText = choice.log || `[事件] ${eventTitle} - ${choice.text}`;
        this.addLog(logText);
        
        // 事件不消耗回合
        setTimeout(() => this.showFreeActions(), 500);
    }
    
    handleFreeAction(action) {
        if (action.cost && this.state.parent.money < action.cost) {
            this.addLog('💸 金钱不足！');
            return;
        }
        
        // 体力检查 - 修复：energyCost为0时不能用 || 10
        const energyCost = action.energyCost !== undefined ? action.energyCost : 10;
        if (this.state.child.energy < energyCost) {
            this.addLog('😴 ' + this.state.child.name + `体力不足（需要${energyCost}）！`);
            return;
        }
        
        // 先扣除金钱和体力，确保UI及时更新
        if (action.cost) {
            this.state.parent.money -= action.cost;
        }
        this.state.child.energy -= energyCost;
        this.updateUI();
        
        const finalEffect = this.calculateEffect(action);
        this.applyEffect(finalEffect);
        
        this.state.turn++;
        this.addLog(`💰 工资收入 +¥${this.state.getStage().income}`);
        
        setTimeout(() => this.startTurn(), 500);
    }
    
    calculateEffect(action) {
        const base = JSON.parse(JSON.stringify(action.baseEffect || {}));
        const scale = action.scaleWith || {};
        
        Object.keys(scale).forEach(attr => {
            const val = this.state.child[attr] || 50;
            // 修复：属性加成只产生正面效果，低属性时不惩罚
            // 公式改为：基础值 * (1 + (属性-50)/100 * 系数)
            // 这样属性50时就是基础值，属性100时是基础值*(1+系数)
            const multiplier = 1 + Math.max(0, (val - 50) / 100 * scale[attr]);
            
            if (base.child) {
                Object.keys(base.child).forEach(key => {
                    if (base.child[key] > 0) {
                        base.child[key] = Math.floor(base.child[key] * multiplier);
                    }
                });
            }
        });
        
        return base;
    }
    
    applyEffect(effect) {
        if (!effect) return;
        
        if (effect.child) {
            Object.keys(effect.child).forEach(key => {
                if (this.state.child[key] !== undefined) {
                    // 保留下限0
                    let newValue = this.state.child[key] + effect.child[key];
                    // 健康、情绪、体力上限100，其他属性无上限
                    if (['health', 'mood', 'energy'].includes(key)) {
                        newValue = Math.min(100, newValue);
                    }
                    this.state.child[key] = Math.max(0, newValue);
                }
            });
        }
        
        if (effect.parent) {
            if (effect.parent.energy) {
                this.state.parent.energy = Math.max(0, Math.min(100, this.state.parent.energy + effect.parent.energy));
            }
            // 修复：处理金钱变化，确保不会负数
            if (effect.parent.money) {
                this.state.parent.money = Math.max(0, this.state.parent.money + effect.parent.money);
            }
        }
        
        this.updateUI();
    }
    
    formatEffect(action) {
        const final = this.calculateEffect(action);
        const parts = [];
        
        // 显示体力消耗
        if (action.energyCost > 0) {
            parts.push(`-${action.energyCost}体力`);
        }
        
        if (final.child) {
            if (final.child.iq) parts.push(`${final.child.iq > 0 ? '+' : ''}${final.child.iq}智商`);
            if (final.child.academic) parts.push(`${final.child.academic > 0 ? '+' : ''}${final.child.academic}学业`);
            if (final.child.talent) parts.push(`${final.child.talent > 0 ? '+' : ''}${final.child.talent}才艺`);
            if (final.child.eq) parts.push(`${final.child.eq > 0 ? '+' : ''}${final.child.eq}情商`);
            if (final.child.charm) parts.push(`${final.child.charm > 0 ? '+' : ''}${final.child.charm}魅力`);
            if (final.child.health) parts.push(`${final.child.health > 0 ? '+' : ''}${final.child.health}健康`);
            if (final.child.mood) parts.push(`${final.child.mood > 0 ? '+' : ''}${final.child.mood}情绪`);
            if (final.child.energy) parts.push(`${final.child.energy > 0 ? '+' : ''}${final.child.energy}体力`);
            if (final.child.discipline) parts.push(`${final.child.discipline > 0 ? '+' : ''}${final.child.discipline}自律`);
        }
        
        return parts.join(' · ');
    }
    
    updateUI() {
        const stage = this.state.getStage();
        document.getElementById('ageDisplay').textContent = this.state.getAgeText();
        document.getElementById('stageDisplay').textContent = stage.name;
        document.getElementById('babyAvatar').textContent = stage.emoji;
        
        document.getElementById('moodBar').style.width = this.state.child.mood + '%';
        document.getElementById('moodValue').textContent = this.state.child.mood;
        document.getElementById('healthBar').style.width = this.state.child.health + '%';
        document.getElementById('healthValue').textContent = this.state.child.health;
        document.getElementById('energyBar').style.width = this.state.child.energy + '%';
        document.getElementById('energyValue').textContent = this.state.child.energy;
        document.getElementById('moneyValue').textContent = '¥' + this.state.parent.money;
        
        // 更新家长体力显示
        const parentEnergyEl = document.getElementById('parentEnergyBar');
        const parentEnergyValueEl = document.getElementById('parentEnergyValue');
        if (parentEnergyEl) parentEnergyEl.style.width = this.state.parent.energy + '%';
        if (parentEnergyValueEl) parentEnergyValueEl.textContent = this.state.parent.energy;
        
        document.getElementById('iqTag').textContent = `智商: ${this.state.child.iq}`;
        document.getElementById('eqTag').textContent = `情商: ${this.state.child.eq}`;
        document.getElementById('talentTag').textContent = `才艺: ${this.state.child.talent}`;
        document.getElementById('charmTag').textContent = `魅力: ${this.state.child.charm}`;
        document.getElementById('academicTag').textContent = `学业: ${this.state.child.academic}`;
        document.getElementById('disciplineTag').textContent = `自律: ${this.state.child.discipline}`;
        
        // 绑定属性点击弹窗
        this.bindAttrClick('iqTag', '🧠 智商', '影响学习效率和高考成绩');
        this.bindAttrClick('eqTag', '💬 情商', '影响社交和人际关系');
        this.bindAttrClick('talentTag', '🎨 才艺', '影响艺术路线结局');
        this.bindAttrClick('charmTag', '✨ 魅力', '影响早恋、网红路线');
        this.bindAttrClick('academicTag', '📖 学业', '直接影响高考成绩');
        this.bindAttrClick('disciplineTag', '📏 自律', '影响抗诱惑能力');
        
        // 绑定面板属性点击弹窗
        this.bindPanelClick('moodItem', '😊 情绪', '低情绪容易抑郁、叛逆，影响心理健康');
        this.bindPanelClick('healthItem', '❤️ 健康', '健康<30会生病住院，影响学习能力');
        this.bindPanelClick('energyItem', '💪 体力', '体力不足无法行动，每回合自动恢复');
        this.bindPanelClick('moneyItem', '💰 金钱', '用于报班、医疗、消费，每回合有工资收入');
        this.bindPanelClick('parentEnergyItem', '👨‍👩‍👧 家长体力', '家长精力不足会影响照顾孩子的能力，每回合自动恢复');
    }
    
    bindPanelClick(id, name, desc) {
        const el = document.getElementById(id);
        if (el && !el._hasClick) {
            el._hasClick = true;
            el.onclick = () => {
                alert(`${name}\n\n${desc}`);
            };
        }
    }
    
    bindAttrClick(id, name, desc) {
        const el = document.getElementById(id);
        if (el && !el._hasClick) {
            el._hasClick = true;
            el.onclick = () => {
                alert(`${name}\n\n${desc}\n\n当前值: ${this.state.child[id.replace('Tag', '')]}`);
            };
        }
    }
    
    addLog(text) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="log-time">[${this.state.getAgeText()}]</span> ${text}`;
        const logBox = document.getElementById('logBox');
        logBox.appendChild(entry);
        
        // 限制日志条数，避免性能问题
        while (logBox.children.length > 100) {
            logBox.removeChild(logBox.firstChild);
        }
        
        logBox.scrollTop = logBox.scrollHeight;
    }
    
    endGame() {
        this.ui.gameScreen.style.display = 'none';
        this.ui.endScreen.style.display = 'flex';
        
        const result = calculateEnding(this.state);
        
        document.getElementById('finalScore').textContent = result.mainEnding.score || '多路线';
        document.getElementById('finalSchool').textContent = result.mainEnding.result;
        
        let statsHtml = `
            <div class="result-stat"><span>💰 最终资产</span><span>¥${this.state.parent.money.toLocaleString()}</span></div>
            <div class="result-stat"><span>智商</span><span>${this.state.child.iq}</span></div>
            <div class="result-stat"><span>情商</span><span>${this.state.child.eq}</span></div>
            <div class="result-stat"><span>才艺</span><span>${this.state.child.talent}</span></div>
            <div class="result-stat"><span>魅力</span><span>${this.state.child.charm}</span></div>
            <div class="result-stat"><span>健康</span><span>${this.state.child.health}</span></div>
            <div class="result-stat"><span>自律</span><span>${this.state.child.discipline}</span></div>
            <div class="result-stat"><span>最终路线</span><span>${result.bestRoute}</span></div>
        `;
        
        // 显示所有可能的结局
        if (result.endings.length > 1) {
            statsHtml += `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0,0,0,0.1);"><strong>其他可能：</strong></div>`;
            result.endings.slice(1, 4).forEach(e => {
                statsHtml += `<div class="result-stat" style="font-size: 12px;"><span>${e.route}</span><span>${e.result.substring(0, 20)}...</span></div>`;
            });
        }
        
        document.getElementById('finalStats').innerHTML = statsHtml;
    }
    
    restart() {
        location.reload();
    }
}

// 初始化
window.game = new Game();