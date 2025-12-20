<template>
  <div class="min-h-screen text-slate-100 flex flex-col items-center overflow-hidden font-sans relative" :style="sceneStyle">
    
    <canvas id="starfield" class="absolute inset-0 z-0 pointer-events-none"></canvas>

    <header class="w-full max-w-7xl flex justify-between items-center z-50 p-8 relative">
      <div class="flex items-center gap-6">
        <div class="group relative">
          <select v-model="currentScene" class="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-2 text-sm font-bold outline-none hover:bg-white/10 transition-all cursor-pointer appearance-none pr-10 text-white">
            <option value="universe">🌌 幻影宇宙</option>
            <option value="library">📚 永恒馆藏</option>
            <option value="snow">🏔️ 寂静极地</option>
          </select>
          <span class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-xs">▼</span>
        </div>
        
        <button @click="isArchiveOpen = true" class="bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 px-6 py-2 rounded-2xl hover:bg-indigo-600/40 transition-all font-black tracking-tighter text-sm">
          ARCHIVE ({{ archive.length }})
        </button>
      </div>

      <transition name="fade">
        <div v-if="selectedCard" class="flex items-center bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl p-1.5 shadow-2xl">
          <button @click.stop="adjustFont(1)" class="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-xl text-xl font-bold">+</button>
          <div class="w-px h-4 bg-white/10 mx-2"></div>
          <button @click.stop="adjustFont(-1)" class="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-xl text-xl font-bold">-</button>
        </div>
      </transition>
    </header>

    <main class="relative z-10 flex-1 flex gap-12 justify-center items-center w-full px-12">
      
      <transition name="fade">
        <div v-if="selectedCard" @click="closeCard" class="fixed inset-0 z-20 bg-slate-950/80 backdrop-blur-md"></div>
      </transition>

      <div 
        v-for="(card, index) in cards" :key="card.id"
        :id="'card-' + card.id"
        :class="[
          'transition-all duration-700 cubic-bezier(0.19, 1, 0.22, 1) rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col group relative',
          selectedCard && selectedCard.id === card.id 
            ? 'fixed inset-0 m-auto w-[85vw] h-[85vh] z-40 p-16 bg-slate-900/60 backdrop-blur-3xl border-white/20 static-card' 
            : 'card-float w-72 h-[450px] p-8 z-10 hover:card-glow cursor-pointer bg-white/5 backdrop-blur-xl'
        ]"
        @click="selectCard(card)"
      >
        <div v-if="!selectedCard" class="absolute top-6 left-0 right-0 px-8 flex justify-between items-center z-50">
          <button @click.stop="refreshOne(index)" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-indigo-600 transition-all flex items-center justify-center pointer-events-auto">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button @click.stop="saveAndCollect(card)" :class="['w-10 h-10 rounded-xl flex items-center justify-center transition-all pointer-events-auto', isCollected(card) ? 'bg-amber-500 shadow-lg' : 'bg-white/10 hover:bg-amber-500/40']">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          </button>
        </div>

        <div v-if="card.title" :class="['w-full h-full flex flex-col relative', selectedCard ? 'overflow-y-auto pr-8 custom-scrollbar' : 'overflow-hidden pt-12']">
          <span class="text-[9px] font-black text-indigo-400 tracking-[0.4em] uppercase mb-4">{{ card.tag }}</span>
          <h2 :class="['font-black text-white transition-all duration-500', selectedCard ? 'text-7xl mb-10' : 'text-2xl mb-6 leading-tight']">
            {{ card.title }}
          </h2>
          <p :class="['text-slate-300 font-light leading-relaxed transition-all', selectedCard ? 'text-2xl mb-12' : 'text-sm opacity-60 line-clamp-4']" :style="selectedCard ? { fontSize: baseFontSize + 'px' } : {}">
            {{ card.brief }}
          </p>

          <div v-if="selectedCard" class="grid grid-cols-1 lg:grid-cols-5 gap-16 animate-slide-up pb-20" :style="{ fontSize: baseFontSize + 'px' }">
            <div class="lg:col-span-3 space-y-12">
              <section class="border-l-4 border-indigo-500 pl-8">
                <h4 class="text-xs font-black text-indigo-400 mb-6 uppercase tracking-widest opacity-50">核心解析</h4>
                <p class="leading-relaxed text-slate-200 font-light whitespace-pre-line">{{ card.detail }}</p>
              </section>
            </div>
            <div class="lg:col-span-2 space-y-12">
              <div v-if="card.story" class="p-10 rounded-[3rem] bg-indigo-500/10 border border-white/10 italic text-slate-300">
                “{{ card.story }}”
              </div>
              
              <div class="space-y-4">
                <button @click.stop="handleSearchRelated(card)" :disabled="card.isFetchingRelated" class="w-full flex justify-between items-center px-8 py-5 bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500 transition-all group">
                  <span class="text-sm font-bold text-indigo-300">#探索关联: {{ card.similar }}</span>
                  <div v-if="card.isFetchingRelated" class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span v-else>→</span>
                </button>
                <transition name="fade">
                  <div v-if="card.relatedContent" class="p-6 bg-indigo-950/30 rounded-2xl border border-indigo-500/20 text-sm leading-relaxed text-indigo-100">
                    {{ card.relatedContent }}
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>

        <div v-if="card.isRefreshing || !card.title" class="absolute inset-0 z-[60] bg-slate-950/90 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center">
          <div class="flex flex-col items-center gap-4">
            <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs text-indigo-400 font-bold tracking-widest animate-pulse">唤醒意识中...</span>
          </div>
        </div>
      </div>
    </main>

    <aside :class="['fixed right-0 top-0 h-full w-[480px] bg-slate-950/98 backdrop-blur-3xl z-[70] transition-transform duration-1000 border-l border-white/10 p-12 flex flex-col', isArchiveOpen ? 'translate-x-0' : 'translate-x-full']">
      <div class="flex justify-between items-center mb-12">
        <h3 class="text-3xl font-black italic text-indigo-400 uppercase">Archive</h3>
        <button @click="isArchiveOpen = false" class="text-slate-500 hover:text-white transition-colors">✕</button>
      </div>
      <div class="flex-1 overflow-y-auto space-y-8 custom-scrollbar">
        <div v-for="(item, idx) in archive" :key="item.id" class="group relative">
          <div @click="previewImage = item.image" class="rounded-[2rem] overflow-hidden border border-white/10 group-hover:border-indigo-500/50 transition-all cursor-pointer shadow-2xl">
            <img :src="item.image" class="w-full h-auto opacity-80 group-hover:opacity-100" />
          </div>
          <button @click.stop="removeFromArchive(idx)" class="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg">✕</button>
        </div>
      </div>
    </aside>

    <div v-if="previewImage" @click="previewImage = null" class="fixed inset-0 z-[110] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-12">
      <img :src="previewImage" class="max-w-full max-h-full rounded-3xl shadow-2xl animate-scale-in" />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import html2canvas from 'html2canvas'
import { getPsychologyCard, getQuickAnnotation } from './aiService'

// --- 修复点：初始化数据提供空字符串兜底 ---
const cards = ref(Array(5).fill().map((_, i) => ({ 
  id: i, 
  title: '', 
  tag: '', 
  brief: '', 
  detail: '',
  similar: '',
  story: '',
  isRefreshing: true, 
  isFetchingRelated: false, 
  relatedContent: null 
})))

const archive = ref([])
const selectedCard = ref(null)
const isArchiveOpen = ref(false)
const previewImage = ref(null)
const baseFontSize = ref(24)
const currentScene = ref('universe')

const sceneStyle = computed(() => {
  const configs = {
    universe: 'background: radial-gradient(circle at center, #020617 0%, #000 100%);',
    library: 'background: linear-gradient(to bottom, #1a1a1a 0%, #050505 100%);',
    snow: 'background: radial-gradient(circle at top, #0f172a 0%, #020617 100%);'
  }
  return configs[currentScene.value]
})

const isCollected = (card) => archive.value.some(i => i.title === card.title)

const saveAndCollect = async (card) => {
  if (!card.title || isCollected(card)) return
  const temp = selectedCard.value
  selectedCard.value = card 
  await new Promise(r => setTimeout(r, 600))
  const element = document.getElementById(`card-${card.id}`)
  const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 })
  archive.value.unshift({ ...card, image: canvas.toDataURL("image/png"), id: Date.now() })
  localStorage.setItem('psych_archive', JSON.stringify(archive.value))
  selectedCard.value = temp
}

const updateCard = async (index) => {
  cards.value[index].isRefreshing = true
  const blacklist = [...cards.value.filter(c => c.title).map(c => c.title), ...archive.value.map(a => a.title)]
  try {
    const data = await getPsychologyCard(blacklist)
    if (data) {
      cards.value[index] = { ...data, id: cards.value[index].id, isRefreshing: false, relatedContent: null }
      localStorage.setItem('current_daily', JSON.stringify(cards.value))
    }
  } catch (e) {
    console.error("AI Request Failed", e)
    cards.value[index].isRefreshing = false
  }
}

const refreshOne = (i) => updateCard(i)

const handleSearchRelated = async (card) => {
  if (!card.similar || card.relatedContent || card.isFetchingRelated) return
  card.isFetchingRelated = true
  try {
    const res = await getQuickAnnotation(card.similar)
    card.relatedContent = res
  } finally {
    card.isFetchingRelated = false
  }
}

const selectCard = (card) => { if(!card.isRefreshing && card.title) selectedCard.value = card }
const closeCard = () => { selectedCard.value = null }
const adjustFont = (d) => { baseFontSize.value = Math.max(16, Math.min(48, baseFontSize.value + d * 2)) }
const removeFromArchive = (i) => {
  archive.value.splice(i, 1)
  localStorage.setItem('psych_archive', JSON.stringify(archive.value))
}

let animationFrame
const initStarfield = () => {
  const canvas = document.getElementById('starfield')
  if(!canvas) return
  const ctx = canvas.getContext('2d')
  let stars = []
  const count = 10000 
  let mouse = { x: -1000, y: -1000 }
  const resize = () => {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    stars = []
    for(let i=0; i<count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: Math.random() * 0.7 + 0.3, o: Math.random() * 0.7 + 0.3, v: Math.random() * 0.3 + 0.1
      })
    }
  }
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "white"
    for(let i=0; i<count; i++) {
      const s = stars[i]
      s.y -= s.v
      if(s.y < 0) s.y = canvas.height
      const dx = mouse.x - s.x
      const dy = mouse.y - s.y
      const dist = Math.sqrt(dx*dx + dy*dy)
      if(dist < 120) {
        const force = (120 - dist) / 120
        s.x -= dx * force * 0.05
        s.y -= dy * force * 0.05
      }
      ctx.globalAlpha = s.o
      ctx.fillRect(s.x, s.y, s.s, s.s)
    }
    animationFrame = requestAnimationFrame(draw)
  }
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY })
  resize(); draw()
}

onMounted(() => {
  initStarfield()
  const saved = localStorage.getItem('psych_archive')
  if (saved) archive.value = JSON.parse(saved)
  const daily = localStorage.getItem('current_daily')
  if (daily) {
    cards.value = JSON.parse(daily).map(c => ({...c, isRefreshing: false, isFetchingRelated: false}))
  } else {
    cards.value.forEach((_, i) => updateCard(i))
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrame)
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.card-float { animation: float 6s ease-in-out infinite; }
.static-card { animation: none !important; transform: none !important; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
.hover\:card-glow:hover {
  transform: translateY(-25px) scale(1.02) !important;
  box-shadow: 0 0 40px rgba(99, 102, 241, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
#starfield { filter: drop-shadow(0 0 2px rgba(255,255,255,0.8)); }
.animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>