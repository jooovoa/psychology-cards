<template>
  <div class="min-h-screen text-slate-100 flex flex-col items-center overflow-hidden font-sans relative transition-all duration-1000" :style="sceneStyle">
    
    <canvas id="starfield" class="absolute inset-0 z-0 pointer-events-none opacity-90"></canvas>
    
    <!-- 背景装饰文字 -->
    <div class="absolute top-20 left-1/2 transform -translate-x-1/2 z-0 pointer-events-none">
      <span class="text-[8vw] font-black text-white/10 tracking-[0.2em] select-none">MINDSCAPE</span>
    </div>

    <!-- 提示框 -->
    <transition name="fade">
      <div v-if="notification.show" class="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-8 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border max-w-md"
           :class="notification.type === 'error' ? 'bg-red-500/20 border-red-500/50' : 'bg-amber-500/20 border-amber-500/50'">
        <div class="flex items-center gap-4">
          <div class="flex-shrink-0">
            <svg v-if="notification.type === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-white font-medium">{{ notification.message }}</p>
          </div>
          <button @click="notification.show = false" class="flex-shrink-0 text-white/70 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <header class="w-full max-w-7xl z-50 p-8 relative">
      <!-- 原有的header内容 -->
      <div class="w-full flex justify-between items-center">
        <div class="flex items-center gap-6">
          <div class="group relative">
            <select v-model="currentScene" class="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-2 text-sm font-bold outline-none hover:bg-white/10 transition-all cursor-pointer appearance-none pr-10 text-white/70 hover:text-white">
              <option value="universe" class="bg-slate-900 text-white/90">🌌 幻影宇宙</option>
              <option value="library" class="bg-slate-900 text-white/90">📚 永恒馆藏</option>
              <option value="snow" class="bg-slate-900 text-white/90">🏔️ 寂静极地</option>
              <option value="custom" class="bg-slate-900 text-white/90">🖼️ 自定义背景</option>
            </select>
            <span class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-xs">▼</span>
          </div>
          
          <!-- 自定义背景上传按钮 -->
          <div v-if="currentScene === 'custom'" class="relative">
            <input 
              type="file" 
              id="bg-upload" 
              accept="image/*" 
              @change="handleBackgroundUpload" 
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <label for="bg-upload" class="bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 px-4 py-2 rounded-2xl hover:bg-indigo-600/40 transition-all font-black tracking-tighter text-sm cursor-pointer flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              上传
            </label>
          </div>
          
          <button @click="isArchiveOpen = true" class="bg-indigo-600/20 backdrop-blur-2xl border border-indigo-500/30 px-6 py-2 rounded-2xl hover:bg-indigo-600/40 transition-all font-black tracking-tighter text-sm">
            ARCHIVE ({{ archive.length }})
          </button>
        </div>

        <!-- 搜索框 - 移到右侧 -->
        <div class="relative group">
          <input 
            v-model="searchQuery"
            @keyup.enter="generateCardFromSearch"
            @input="handleSearchInput"
            type="text" 
            placeholder="搜索心理学概念..." 
            class="w-96 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl px-5 py-2.5 pr-12 text-white placeholder-white/50 outline-none focus:bg-white/15 focus:border-white/40 transition-all text-sm"
          />
          <button 
            @click="generateCardFromSearch"
            :disabled="isGenerating || !searchQuery.trim()"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-indigo-600/30 hover:bg-indigo-600/50 disabled:bg-white/10 disabled:opacity-50 rounded-xl flex items-center justify-center transition-all"
          >
            <svg v-if="!isGenerating" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </button>
          <!-- 搜索建议 -->
          <div v-if="searchSuggestions.length > 0 && showSuggestions" class="absolute top-full left-0 right-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 z-50">
            <div 
              v-for="suggestion in searchSuggestions" 
              :key="suggestion"
              @click="selectSuggestion(suggestion)"
              class="px-3 py-1.5 hover:bg-white/10 rounded-lg cursor-pointer text-white/80 hover:text-white transition-all text-sm"
            >
              {{ suggestion }}
            </div>
          </div>
        </div>

        <transition name="fade">
          <div v-if="selectedCard" class="flex items-center bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl p-1.5 shadow-2xl">
            <button @click.stop="adjustFont(1)" class="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-xl text-xl font-bold">+</button>
            <div class="w-px h-4 bg-white/10 mx-2"></div>
            <button @click.stop="adjustFont(-1)" class="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-xl text-xl font-bold">-</button>
          </div>
        </transition>
      </div>
    </header>

    <main class="relative z-10 flex-1 flex gap-12 justify-center items-center w-full px-12">
      
      <transition name="fade">
        <div v-if="selectedCard" @click="closeCard" class="fixed inset-0 z-20 bg-slate-950/80 backdrop-blur-md"></div>
      </transition>

      <transition name="fade">
        <div v-if="archiveCard" @click="closeArchiveCard" class="fixed inset-0 z-25 bg-slate-950/80 backdrop-blur-md"></div>
      </transition>

      <transition name="fade">
        <div v-if="archiveCard" class="fixed inset-0 m-auto w-[80vw] h-[80vh] z-45 p-16 bg-slate-900/40 backdrop-blur-3xl border-white/20 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
          <div class="w-full h-full flex flex-col relative overflow-y-auto pr-8 custom-scrollbar">
            <div class="flex justify-between items-center mb-6">
              <span class="text-sm font-bold text-indigo-300 tracking-widest uppercase bg-indigo-500/5 px-4 py-2 rounded-lg border border-indigo-500/20">{{ archiveCard.tag }}</span>
              <button @click="closeArchiveCard" class="text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <h2 class="font-black text-white text-7xl mb-10 leading-tight">
              {{ archiveCard.title }}
            </h2>

            <p class="text-slate-300 font-light leading-relaxed text-2xl mb-12" :style="{ fontSize: baseFontSize + 'px' }">
              {{ archiveCard.brief }}
            </p>

            <div class="grid grid-cols-1 lg:grid-cols-5 gap-16 animate-slide-up pb-20" :style="{ fontSize: baseFontSize + 'px' }">
              <div class="lg:col-span-3 space-y-12">
              <section class="relative bg-gradient-to-br from-indigo-500/15 to-indigo-600/10 p-12 rounded-[3rem] border-l-4 border-indigo-500 shadow-2xl backdrop-blur-xl">
                <div class="absolute -top-4 -left-4 w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                  <span class="text-white text-xl font-black">01</span>
                </div>
                <div class="flex items-center gap-6 mb-10 mt-6">
                  <div class="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-indigo-500/30">
                    <svg class="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-2xl font-black text-indigo-400 uppercase tracking-widest">核心解析</h4>
                    <p class="text-sm text-indigo-300/70 mt-1">Theory & Analysis</p>
                  </div>
                </div>
                <div class="bg-indigo-500/5 p-8 rounded-2xl backdrop-blur-xl border border-indigo-500/10">
                  <p class="leading-relaxed text-slate-200 font-light whitespace-pre-line" :style="{ fontSize: baseFontSize + 'px' }">{{ archiveCard.detail }}</p>
                </div>
              </section>
              <section class="relative bg-gradient-to-br from-amber-500/15 to-orange-600/10 p-12 rounded-[3rem] border-l-4 border-amber-500 shadow-2xl backdrop-blur-xl">
                <div class="absolute -top-4 -left-4 w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                  <span class="text-white text-xl font-black">02</span>
                </div>
                <div class="flex items-center gap-6 mb-10 mt-6">
                  <div class="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-amber-500/30">
                    <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-2xl font-black text-amber-400 uppercase tracking-widest">场景应用</h4>
                    <p class="text-sm text-amber-300/70 mt-1">Application & Usage</p>
                  </div>
                </div>
                <div class="space-y-4">
                  <div class="bg-amber-500/5 p-6 rounded-2xl backdrop-blur-xl border border-amber-500/10">
                    <h5 class="text-sm font-bold text-amber-300 mb-3 uppercase tracking-wider">应用场景 1</h5>
                    <p class="text-slate-300 leading-relaxed" :style="{ fontSize: baseFontSize + 'px' }">{{ archiveCard.usage.split('\n')[0].replace('现代应用1：', '') }}</p>
                  </div>
                  <div class="bg-amber-500/5 p-6 rounded-2xl backdrop-blur-xl border border-amber-500/10">
                    <h5 class="text-sm font-bold text-amber-300 mb-3 uppercase tracking-wider">应用场景 2</h5>
                    <p class="text-slate-300 leading-relaxed" :style="{ fontSize: baseFontSize + 'px' }">{{ archiveCard.usage.split('\n')[1]?.replace('现代应用2：', '') || '' }}</p>
                  </div>
                </div>
              </section>
            </div>
            <div class="lg:col-span-2 space-y-12">
              <section class="bg-gradient-to-br from-purple-500/15 to-purple-600/10 p-12 rounded-[3rem] border-l-4 border-purple-500 shadow-2xl relative overflow-hidden">
                <div class="absolute -top-4 -left-4 w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span class="text-white text-xl font-black">03</span>
                </div>
                <div class="flex items-center gap-6 mb-10 mt-6">
                  <div class="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-purple-500/30">
                    <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-2xl font-black text-purple-400 uppercase tracking-widest">实验案例</h4>
                    <p class="text-sm text-purple-300/70 mt-1">Case Study</p>
                  </div>
                </div>
                <div class="space-y-4">
                  <div class="bg-purple-500/5 p-6 rounded-2xl backdrop-blur-xl border border-purple-500/10">
                    <h5 class="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">经典案例</h5>
                    <p class="italic text-slate-200 leading-relaxed" :style="{ fontSize: baseFontSize + 'px' }">{{ archiveCard.story.split('\n')[0]?.replace('经典案例：', '') || '' }}</p>
                  </div>
                  <div class="bg-purple-500/5 p-6 rounded-2xl backdrop-blur-xl border border-purple-500/10">
                    <h5 class="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">现代热点</h5>
                    <p class="italic text-slate-200 leading-relaxed" :style="{ fontSize: baseFontSize + 'px' }">{{ archiveCard.story.split('\n')[1]?.replace('现代热点：', '') || '' }}</p>
                  </div>
                  <div v-if="hasThirdCase(archiveCard)" class="bg-purple-500/5 p-6 rounded-2xl backdrop-blur-xl border border-purple-500/10">
                    <h5 class="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">趣味案例</h5>
                    <p class="italic text-slate-200 leading-relaxed" :style="{ fontSize: baseFontSize + 'px' }">{{ archiveCard.extraCase }}</p>
                  </div>
                </div>
              </section>
                <button @click.stop="fetchRelatedContent(archiveCard.similar)" :disabled="archiveCard.isFetchingRelated" class="w-full group-btn relative overflow-hidden bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl border border-indigo-500/30 hover:border-indigo-400/80 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.05] active:scale-[1.02]">
                  <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-btn-hover:opacity-100 transition-opacity duration-500"></div>
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-btn-hover:translate-x-full transition-transform duration-700"></div>
                  <div class="relative p-8">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 group-btn-hover:scale-125 group-btn-hover:rotate-6 transition-all duration-300 group-btn-hover:shadow-xl group-btn-hover:shadow-indigo-500/50">
                          <span class="text-indigo-300 text-lg font-bold group-btn-hover:text-cyan-300 transition-all duration-300 group-btn-hover:scale-110">#</span>
                        </div>
                        <div class="text-left">
                          <span class="text-sm font-bold text-indigo-300/70 block mb-1 group-btn-hover:text-cyan-300 transition-all duration-300 group-btn-hover:translate-x-1">探索关联</span>
                          <span class="font-bold text-indigo-200 group-btn-hover:text-cyan-100 transition-all duration-300 group-btn-hover:translate-x-1" :style="{ fontSize: (baseFontSize - 2) + 'px' }">{{ archiveCard.similar }}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <div v-if="archiveCard.isFetchingRelated" class="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        <template v-else>
                          <div class="flex gap-1">
                            <div class="w-3 h-3 rounded-full bg-indigo-400 opacity-0 group-btn-hover:opacity-100 transition-all duration-300 animate-pulse group-btn-hover:scale-150 group-btn-hover:bg-cyan-400"></div>
                            <div class="w-3 h-3 rounded-full bg-indigo-400 opacity-0 group-btn-hover:opacity-100 transition-all duration-300 animate-pulse delay-75 group-btn-hover:scale-150 group-btn-hover:bg-cyan-400"></div>
                            <div class="w-3 h-3 rounded-full bg-indigo-400 opacity-0 group-btn-hover:opacity-100 transition-all duration-300 animate-pulse delay-150 group-btn-hover:scale-150 group-btn-hover:bg-cyan-400"></div>
                          </div>
                          <svg class="w-6 h-6 text-indigo-300 group-btn-hover:text-cyan-300 transition-all duration-300 group-btn-hover:translate-x-3 group-btn-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                          </svg>
                        </template>
                      </div>
                    </div>
                  </div>
                </button>
                <!-- 关联内容展示区域 -->
                <transition name="fade">
                  <div v-if="archiveCard.relatedContent" class="mt-6 p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16"></div>
                    <div class="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full -ml-12 -mb-12"></div>
                    <div class="relative">
                      <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                          </svg>
                        </div>
                        <div>
                          <h5 class="text-base font-bold text-indigo-300">{{ archiveCard.similar }}</h5>
                          <p class="text-xs text-indigo-400/70">相关知识</p>
                        </div>
                      </div>
                      <div class="bg-indigo-500/5 p-6 rounded-2xl backdrop-blur-xl border border-indigo-500/10">
                      <p class="text-slate-200 leading-relaxed" :style="{ fontSize: baseFontSize + 'px' }">{{ archiveCard.relatedContent }}</p>
                    </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <div 
        v-for="(card, index) in cards" :key="card.id"
        :id="'card-' + card.id"
        :class="[
          'transition-all duration-700 cubic-bezier(0.19, 1, 0.22, 1) rounded-[2.5rem] border shadow-2xl flex flex-col group',
          selectedCard && selectedCard.id === card.id 
            ? 'fixed inset-0 m-auto w-[80vw] h-[80vh] z-40 p-16' 
            : 'card-float w-72 h-[450px] p-8 z-10 hover:card-glow cursor-pointer relative'
        ]"
        :style="{
          ...(selectedCard && selectedCard.id === card.id ? getExpandedCardStyle : getCardStyle),
          ...(selectedCard ? {} : { animationDelay: `${index * 0.2}s` }),
          ...(card.isDragging ? { 
            transform: `translateY(${card.dragOffset || 0}px) rotate(${card.dragOffset > 30 ? Math.min(card.dragOffset / 10, 15) : -Math.min(card.dragOffset / 10, 15)}deg) scale(${card.dragOffset > 50 ? 0.95 : 1})`,
            opacity: card.dragOffset > 50 ? Math.max(0.3, 1 - (card.dragOffset - 50) / 100) : 1,
            boxShadow: card.dragOffset > 30 ? `0 ${Math.min(card.dragOffset / 2, 30)}px ${Math.min(card.dragOffset, 60)}px rgba(239, 68, 68, ${Math.min(card.dragOffset / 100, 0.6)})` : '',
            zIndex: card.isDragging ? 100 : 10,
            transition: card.isDragging ? 'none' : 'all 0.7s cubic-bezier(0.19, 1, 0.22, 1)',
            cursor: card.isDragging ? 'grabbing' : 'grab'
          } : {}),
          ...(card.isDeleting ? {
            transform: `translateY(300px) rotate(20deg) scale(0.8)`,
            opacity: 0,
            transition: 'all 0.3s ease-in'
          } : {})
        }"
        @click="handleCardClick(card)"
        @mousedown="handleMouseDown($event, card)"
        @mousemove="handleMouseMove($event, card)"
        @mouseup="handleMouseUp($event, card)"
        @mouseleave="handleMouseUp($event, card)"
        @touchstart="handleTouchStart($event, card)"
        @touchmove="handleTouchMove($event, card)"
        @touchend="handleTouchEnd($event, card)"
      >
        <div v-if="!selectedCard" class="absolute top-6 left-0 right-0 px-8 flex justify-between items-center z-20">
          <button @click.stop="refreshOne(index)" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-indigo-600 transition-all flex items-center justify-center group/btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 opacity-40 group-hover/btn:opacity-100 group-hover/btn:rotate-180 transition-all duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button @click.stop="saveAndCollect(card)" :class="['w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300', isCollected(card) ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] text-white' : 'bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 text-white/60']">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" :class="isCollected(card) ? 'fill-current' : ''" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          </button>
        </div>

        <div :class="['w-full h-full flex flex-col relative', selectedCard ? 'overflow-y-auto pr-8 custom-scrollbar' : 'overflow-hidden pt-12']">
          <!-- 分类标签区域 -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-indigo-300 tracking-widest uppercase bg-indigo-500/5 px-4 py-2 rounded-lg border border-indigo-500/20">{{ card.tag }}</span>
              <span v-if="selectedCard" class="text-xs font-black text-amber-400 tracking-[0.2em] uppercase bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/20">心理学知识</span>
            </div>
            <!-- 展开状态下的收藏按钮 -->
            <button v-if="selectedCard" @click.stop="saveAndCollect(card)" :class="['w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300', isCollected(card) ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] text-white' : 'bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 text-white/60']">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" :class="isCollected(card) ? 'fill-current' : ''" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            </button>
          </div>

          <h2 :class="['font-black transition-all duration-500', selectedCard ? 'text-7xl mb-8' : 'text-2xl mb-4 leading-tight']">
            {{ card.title }}
          </h2>

          <p :class="['font-light leading-relaxed transition-all', selectedCard ? 'text-2xl mb-10' : 'text-sm opacity-60 line-clamp-4']" :style="selectedCard ? { fontSize: baseFontSize + 'px' } : {}">
            {{ card.brief }}
          </p>

          <!-- 未展开状态的预览 -->
          <div v-if="!selectedCard" class="mt-auto pt-4 border-t border-white/5">
            <div class="flex items-center justify-between">
              <span class="text-xs text-indigo-300 font-bold">点击查看详情</span>
              <svg class="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>

          <div v-if="selectedCard" class="grid grid-cols-1 lg:grid-cols-5 gap-16 animate-slide-up pb-20" :style="{ fontSize: baseFontSize + 'px' }">
            <div class="lg:col-span-3 space-y-12">
              <section class="relative p-12 rounded-[3rem] border-l-4 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-indigo-500/15 to-indigo-600/10 border-indigo-500">
                <div class="absolute -top-4 -left-4 w-20 h-20 rounded-full flex items-center justify-center shadow-lg bg-indigo-500">
                  <span class="text-white text-xl font-black">01</span>
                </div>
                <div class="flex items-center gap-6 mb-10 mt-6">
                  <div class="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-xl border bg-indigo-500/20 border-indigo-500/30">
                    <svg class="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-2xl font-black uppercase tracking-widest text-indigo-400">核心解析</h4>
                    <p class="text-sm mt-1 text-indigo-300/70">Theory & Analysis</p>
                  </div>
                </div>
                <div class="p-8 rounded-2xl backdrop-blur-xl border bg-indigo-500/5 border-indigo-500/10">
                  <p :class="['leading-relaxed font-light whitespace-pre-line', getTextColorClass]" :style="{ fontSize: baseFontSize + 'px' }">{{ card.detail }}</p>
                </div>
              </section>
              <section class="relative p-12 rounded-[3rem] border-l-4 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-amber-500/15 to-amber-600/10 border-amber-500">
                <div class="absolute -top-4 -left-4 w-20 h-20 rounded-full flex items-center justify-center shadow-lg bg-amber-500">
                  <span class="text-white text-xl font-black">02</span>
                </div>
                <div class="flex items-center gap-6 mb-10 mt-6">
                  <div class="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-xl border bg-amber-500/20 border-amber-500/30">
                    <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-2xl font-black uppercase tracking-widest text-amber-400">应用场景</h4>
                    <p class="text-sm mt-1 text-amber-300/70">Application & Usage</p>
                  </div>
                </div>
                <div class="space-y-4">
                  <div class="p-6 rounded-2xl backdrop-blur-xl border bg-amber-500/5 border-amber-500/10">
                    <h5 class="text-sm font-bold mb-3 uppercase tracking-wider text-amber-300">应用场景 1</h5>
                    <p :class="['leading-relaxed', getTextColorClass]" :style="{ fontSize: baseFontSize + 'px' }">{{ card.usage.split('\n')[0].replace('现代应用1：', '') }}</p>
                  </div>
                  <div class="p-6 rounded-2xl backdrop-blur-xl border bg-amber-500/5 border-amber-500/10">
                    <h5 class="text-sm font-bold mb-3 uppercase tracking-wider text-amber-300">应用场景 2</h5>
                    <p :class="['leading-relaxed', getTextColorClass]" :style="{ fontSize: baseFontSize + 'px' }">{{ card.usage.split('\n')[1]?.replace('现代应用2：', '') || '' }}</p>
                  </div>
                </div>
              </section>
            </div>
            <div class="lg:col-span-2 space-y-12">
              <section class="bg-gradient-to-br p-12 rounded-[3rem] border-l-4 shadow-2xl relative overflow-hidden from-purple-500/15 to-purple-600/10 border-purple-500">
                <div class="absolute -top-4 -left-4 w-20 h-20 rounded-full flex items-center justify-center shadow-lg bg-purple-500">
                  <span class="text-white text-xl font-black">03</span>
                </div>
                <div class="flex items-center gap-6 mb-10 mt-6">
                  <div class="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-xl border bg-purple-500/20 border-purple-500/30">
                    <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-2xl font-black uppercase tracking-widest text-purple-400">实验案例</h4>
                    <p class="text-sm mt-1 text-purple-300/70">Case Study</p>
                  </div>
                </div>
                <div class="space-y-4">
                  <div class="p-6 rounded-2xl backdrop-blur-xl border bg-purple-500/5 border-purple-500/10">
                    <h5 class="text-sm font-bold mb-3 uppercase tracking-wider text-purple-300">经典案例</h5>
                    <p :class="['italic leading-relaxed', getTextColorClass]" :style="{ fontSize: baseFontSize + 'px' }">{{ card.story.split('\n')[0]?.replace('经典案例：', '') || '' }}</p>
                  </div>
                  <div class="p-6 rounded-2xl backdrop-blur-xl border bg-purple-500/5 border-purple-500/10">
                    <h5 class="text-sm font-bold mb-3 uppercase tracking-wider text-purple-300">现代热点</h5>
                    <p :class="['italic leading-relaxed', getTextColorClass]" :style="{ fontSize: baseFontSize + 'px' }">{{ card.story.split('\n')[1]?.replace('现代热点：', '') || '' }}</p>
                  </div>
                  <div v-if="hasThirdCase(card)" class="p-6 rounded-2xl backdrop-blur-xl border bg-purple-500/5 border-purple-500/10">
                    <h5 class="text-sm font-bold mb-3 uppercase tracking-wider text-purple-300">趣味案例</h5>
                    <p :class="['italic leading-relaxed', getTextColorClass]" :style="{ fontSize: baseFontSize + 'px' }">{{ card.extraCase }}</p>
                  </div>
                </div>
              </section>
              <button @click.stop="fetchRelatedContent(card.similar)" :disabled="card.isFetchingRelated" class="w-full group-btn relative overflow-hidden rounded-3xl border transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.05] active:scale-[1.02] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 border-indigo-500/30 hover:border-indigo-400/80">
                  <div class="absolute inset-0 opacity-0 group-btn-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-btn-hover:translate-x-full transition-transform duration-700"></div>
                  <div class="relative p-8">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-xl border group-btn-hover:scale-125 group-btn-hover:rotate-6 transition-all duration-300 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border-white/10 group-btn-hover:shadow-xl group-btn-hover:shadow-indigo-500/50">
                          <span class="text-lg font-bold text-indigo-300 group-btn-hover:text-cyan-300 transition-all duration-300 group-btn-hover:scale-110">#</span>
                        </div>
                        <div class="text-left">
                          <span class="text-sm font-bold block mb-1 text-indigo-300/70 group-btn-hover:text-cyan-300 transition-all duration-300 group-btn-hover:translate-x-1">探索关联</span>
                          <span class="font-bold transition-all duration-300 group-btn-hover:text-cyan-100 group-btn-hover:translate-x-1 text-indigo-200" :style="{ fontSize: (baseFontSize - 2) + 'px' }">{{ card.similar }}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <div v-if="card.isFetchingRelated" class="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin border-indigo-400"></div>
                        <template v-else>
                          <div class="flex gap-1">
                              <div class="w-3 h-3 rounded-full opacity-0 group-btn-hover:opacity-100 transition-all duration-300 animate-pulse bg-indigo-400 group-btn-hover:scale-150 group-btn-hover:bg-cyan-400"></div>
                              <div class="w-3 h-3 rounded-full opacity-0 group-btn-hover:opacity-100 transition-all duration-300 animate-pulse delay-75 bg-indigo-400 group-btn-hover:scale-150 group-btn-hover:bg-cyan-400"></div>
                              <div class="w-3 h-3 rounded-full opacity-0 group-btn-hover:opacity-100 transition-all duration-300 animate-pulse delay-150 bg-indigo-400 group-btn-hover:scale-150 group-btn-hover:bg-cyan-400"></div>
                            </div>
                            <svg class="w-6 h-6 transition-all duration-300 group-btn-hover:translate-x-3 group-btn-hover:scale-125 text-indigo-300 group-btn-hover:text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                          </svg>
                        </template>
                      </div>
                    </div>
                  </div>
                </button>
              <!-- 关联内容展示区域 -->
              <transition name="fade">
                <div v-if="card.relatedContent" class="mt-6 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/30">
                  <div class="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 bg-indigo-500/10"></div>
                  <div class="absolute bottom-0 left-0 w-24 h-24 rounded-full -ml-12 -mb-12 bg-purple-500/10"></div>
                  <div class="relative">
                    <div class="flex items-center gap-3 mb-6">
                      <div class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                      </div>
                      <div>
                        <h5 class="text-base font-bold text-white">{{ card.similar }}</h5>
                        <p class="text-xs text-indigo-400/70">探索相关内容</p>
                      </div>
                    </div>
                    <div class="p-6 rounded-2xl backdrop-blur-xl border bg-indigo-500/5 border-indigo-500/10">
                      <p :class="['leading-relaxed', getTextColorClass]" :style="{ fontSize: baseFontSize + 'px' }">{{ card.relatedContent }}</p>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <div v-if="card.isRefreshing" class="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center">
          <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </main>

    <transition name="fade">
      <div v-if="isArchiveOpen" @click="isArchiveOpen = false" class="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm"></div>
    </transition>

    <aside :class="['fixed right-0 top-0 h-full bg-slate-950/98 backdrop-blur-3xl z-[60] transition-all duration-1000 border-l border-white/10 p-12 flex flex-col', isArchiveOpen ? 'translate-x-0' : 'translate-x-full', expandArchive ? 'w-[50vw]' : 'w-[480px]']">
      <div class="flex justify-between items-center mb-6">
        <button @click="expandArchive = !expandArchive" class="text-slate-400 hover:text-white transition-all">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="expandArchive ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'"></path>
          </svg>
        </button>
      </div>
      <div class="flex justify-between items-center mb-12">
        <h3 class="text-3xl font-black italic text-indigo-400">MEMORY HALL</h3>
        <button @click="isArchiveOpen = false" class="text-slate-500">✕</button>
      </div>
      
      <!-- 分类标签 -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button @click="filterArchive('all')" :class="['px-4 py-2 rounded-full text-sm font-bold transition-all', activeFilter === 'all' ? 'bg-indigo-500/30 text-white' : 'bg-white/5 text-indigo-300 hover:bg-white/10']">全部</button>
        <button v-for="tag in uniqueTags" :key="tag" @click="filterArchive(tag)" :class="['px-4 py-2 rounded-full text-sm font-bold transition-all', activeFilter === tag ? 'bg-indigo-500/30 text-white' : 'bg-white/5 text-indigo-300 hover:bg-white/10']">{{ tag }}</button>
      </div>
      
      <!-- 分类折叠面板 -->
      <div class="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
        <div v-for="(group, tag) in filteredArchiveGroups" :key="tag">
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-lg font-bold text-indigo-300">{{ tag }} ({{ group.length }})</h4>
            <button @click="toggleGroup(tag)" class="text-slate-400 hover:text-white transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{{ expandedGroups.includes(tag) ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7' }}"></path>
              </svg>
            </button>
          </div>
          
          <div v-if="expandedGroups.includes(tag)" class="space-y-3 pl-4">
            <div v-for="(item, idx) in group" :key="item.id" @click="viewArchiveCard(item)" class="group p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-pointer shadow-xl">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h5 class="text-lg font-bold text-white mb-1">{{ item.title }}</h5>
                  <p class="text-xs text-slate-400 line-clamp-2">{{ item.brief }}</p>
                </div>
                <button @click.stop="removeFromArchive(item)" class="ml-3 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs">✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <div v-if="previewImage" @click="previewImage = null" class="fixed inset-0 z-[110] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-12">
      <img :src="previewImage" class="max-w-full max-h-full rounded-3xl shadow-2xl animate-scale-in" />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import html2canvas from 'html2canvas'
import { getPsychologyCard, getPsychologyCardFromSearch, getQuickAnnotation, getSearchSuggestions } from './aiService'

// --- 状态变量 ---
const cards = ref(Array(5).fill().map((_, i) => ({ id: i, title: 'Loading', isRefreshing: true, isFetchingRelated: false, isDragging: false, isDeleting: false, dragOffset: 0, wasDragged: false, hasMoved: false })))
const archive = ref([])
const selectedCard = ref(null)
const archiveCard = ref(null) // 收藏夹中显示的卡牌
const isArchiveOpen = ref(false)
const previewImage = ref(null)
const annotation = ref(null)
const baseFontSize = ref(18)
const currentScene = ref('universe')

// --- 收藏夹分类相关状态 ---
const activeFilter = ref('all')
const expandedGroups = ref([])
const expandArchive = ref(false)

// --- 搜索相关状态 ---
const searchQuery = ref('')
const searchSuggestions = ref([])
const showSuggestions = ref(false)
const isGenerating = ref(false)

// --- 拖拽删除相关状态 ---
const draggingCard = ref(null)
const dragOffset = ref(0)
const startY = ref(0)

// --- 通知状态 ---
const notification = ref({
  show: false,
  message: '',
  type: 'info' // 'error', 'warning', 'info'
})

// 显示通知的方法
const showNotification = (message, type = 'info') => {
  notification.value = {
    show: true,
    message,
    type
  }
  
  // 3秒后自动关闭
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 预定义的心理学概念建议
const psychologyConcepts = [
  // 认知心理学
  '认知失调', '确认偏误', '锚定效应', '可用性启发', '代表性启发',
  '认知负荷', '工作记忆', '长期记忆', '注意力偏差', '思维定势',
  
  // 社会心理学
  '社会惰化', '从众心理', '基本归因错误', '群体思维', '旁观者效应',
  '社会认同理论', '自我实现预言', '社会比较理论', '权威服从', '互惠原则',
  
  // 人格心理学
  '大五人格', '内向与外向', '自恋型人格', '边缘型人格', '强迫型人格',
  '人格特质', '自我概念', '自尊理论', '身份认同', '人格发展',
  
  // 发展心理学
  '依恋理论', '心理发展阶段', '青春期危机', '中年危机', '认知发展',
  '语言发展', '社会性发展', '道德发展', '自我中心', '客体永久性',
  
  // 临床心理学
  '抑郁症', '焦虑症', '创伤后应激', '强迫症', '恐惧症',
  '心理治疗', '认知行为疗法', '精神分析', '人本主义疗法', '家庭治疗',
  
  // 积极心理学
  '心理弹性', '心流体验', '感恩', '乐观主义', '自我效能感',
  '幸福感', '成长型思维', '情绪调节', '压力管理', '正念冥想',
  
  // 其他经典理论
  '马斯洛需求层次', '习得性无助', '心理防御机制', '前景理论', '双因素理论',
  '成就动机理论', '归因理论', '认知失调', '情绪智力', '社会学习理论'
]

// 监听场景变化，更新背景亮度
watch(currentScene, (newScene) => {
  if (newScene !== 'custom') {
    // 预设场景都是深色
    isDarkBackground.value = true
  }
})

// --- 背景主题 ---
const customBackgroundImage = ref(localStorage.getItem('customBackgroundImage') || '')

// 检测当前背景是否为深色
const isDarkBackground = ref(true) // 默认为深色

// 分析图片亮度
const analyzeImageBrightness = (imageData) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 缩小图片尺寸以提高性能
      const scaleFactor = 50 / Math.max(img.width, img.height)
      canvas.width = img.width * scaleFactor
      canvas.height = img.height * scaleFactor
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // 获取图片数据
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      
      // 计算平均亮度
      let totalBrightness = 0
      for (let i = 0; i < data.length; i += 4) {
        // 使用相对亮度公式
        const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        totalBrightness += brightness
      }
      
      const avgBrightness = totalBrightness / (data.length / 4)
      // 如果平均亮度大于128，认为是浅色背景
      resolve(avgBrightness > 128)
    }
    
    img.src = imageData
  })
}

// 根据背景亮度获取卡牌样式
const getCardStyle = computed(() => {
  // 统一使用深色背景样式
  return {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(12px)',
    color: '#ffffff'
  }
})

// 获取卡牌展开时的样式
const getExpandedCardStyle = computed(() => {
  // 无论深色还是浅色背景，都使用相同的展开效果
  return {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(20px)',
    color: '#ffffff'
  }
})

// 获取文字颜色类
const getTextColorClass = computed(() => {
  return 'text-white'
})

// 获取次要文字颜色类
const getSecondaryTextColorClass = computed(() => {
  return 'text-slate-300'
})

// 获取标题颜色
const getTitleColor = computed(() => {
  return 'text-white'
})

// 获取内容颜色
const getContentColor = computed(() => {
  return 'text-white'
})

// 获取背景颜色类
const getBackgroundClass = computed(() => {
  return 'bg-slate-900/5'
})

// 获取展开背景颜色类
const getExpandedBackgroundClass = computed(() => {
  return 'bg-slate-800/80'
})

// 获取边框颜色类
const getBorderColorClass = computed(() => {
  return 'border-white/20'
})

// 获取展开边框颜色类
const getExpandedBorderColorClass = computed(() => {
  return 'border-white/30'
})

// --- 收藏夹分类相关计算属性 ---
const uniqueTags = computed(() => {
  const tags = new Set()
  archive.value.forEach(item => tags.add(item.tag))
  return Array.from(tags).sort()
})

const filteredArchive = computed(() => {
  if (activeFilter.value === 'all') {
    return archive.value
  }
  return archive.value.filter(item => item.tag === activeFilter.value)
})

const filteredArchiveGroups = computed(() => {
  const groups = {}
  filteredArchive.value.forEach(item => {
    if (!groups[item.tag]) {
      groups[item.tag] = []
    }
    groups[item.tag].push(item)
  })
  return groups
})

const sceneStyle = computed(() => {
  const configs = {
    universe: 'background: radial-gradient(circle at center, #020617 0%, #000 100%);',
    library: 'background: linear-gradient(to bottom, #1a1a1a 0%, #050505 100%);',
    snow: 'background: radial-gradient(circle at top, #0f172a 0%, #020617 100%);',
    custom: customBackgroundImage.value ? `background-image: url('${customBackgroundImage.value}'); background-size: cover; background-position: center; background-repeat: no-repeat;` : 'background: radial-gradient(circle at center, #020617 0%, #000 100%);'
  }
  return configs[currentScene.value]
})

// --- 拖拽删除功能 ---
const handleMouseDown = (e, card) => {
  if (selectedCard.value) return // 如果卡片已展开，不处理拖拽
  
  startY.value = e.clientY
  draggingCard.value = card
  dragOffset.value = 0
  card.isDragging = true
  card.wasDragged = false // 标记是否发生了拖动
  card.hasMoved = false // 标记是否发生了移动
  e.preventDefault() // 防止选中文本
}

const handleMouseMove = (e, card) => {
  if (!draggingCard.value || draggingCard.value !== card) return
  
  const offset = e.clientY - startY.value
  if (offset > 5) { // 降低拖动阈值，使其更敏感
    dragOffset.value = offset
    card.dragOffset = offset
    card.wasDragged = true // 标记已发生拖动
    card.hasMoved = true // 标记已发生移动
    e.preventDefault() // 防止选中文本
  }
}

const handleMouseUp = (e, card) => {
  if (!draggingCard.value || draggingCard.value !== card) return
  
  // 如果拖动距离超过80px，则删除卡片
  if (dragOffset.value > 80) {
    // 添加删除动画效果
    card.dragOffset = 300
    card.isDeleting = true
    
    setTimeout(() => {
      cards.value = cards.value.filter(c => c.id !== card.id)
      showNotification(`已删除 "${card.title}"`, 'info')
    }, 300)
  } else {
    // 重置拖拽状态
    card.isDragging = false
    card.dragOffset = 0
    // 如果发生了移动，则标记为拖拽过，防止触发点击事件
    if (card.hasMoved) {
      card.wasDragged = true
      // 延迟重置拖拽状态，确保不影响后续点击
      resetDragState(card)
    }
  }
  
  draggingCard.value = null
  dragOffset.value = 0
}

// 触摸事件处理
const handleTouchStart = (e, card) => {
  if (selectedCard.value) return
  
  startY.value = e.touches[0].clientY
  draggingCard.value = card
  dragOffset.value = 0
  card.isDragging = true
  card.wasDragged = false // 标记是否发生了拖动
  card.hasMoved = false // 标记是否发生了移动
}

const handleTouchMove = (e, card) => {
  if (!draggingCard.value || draggingCard.value !== card) return
  
  const offset = e.touches[0].clientY - startY.value
  if (offset > 5) { // 降低拖动阈值，使其更敏感
    dragOffset.value = offset
    card.dragOffset = offset
    card.wasDragged = true // 标记已发生拖动
    card.hasMoved = true // 标记已发生移动
  }
}

const handleTouchEnd = (e, card) => {
  if (!draggingCard.value || draggingCard.value !== card) return
  
  // 如果拖动距离超过80px，则删除卡片
  if (dragOffset.value > 80) {
    // 添加删除动画效果
    card.dragOffset = 300
    card.isDeleting = true
    
    setTimeout(() => {
      cards.value = cards.value.filter(c => c.id !== card.id)
      showNotification(`已删除 "${card.title}"`, 'info')
    }, 300)
  } else {
    // 重置拖拽状态
    card.isDragging = false
    card.dragOffset = 0
    // 如果发生了移动，则标记为拖拽过，防止触发点击事件
    if (card.hasMoved) {
      card.wasDragged = true
      // 延迟重置拖拽状态，确保不影响后续点击
      resetDragState(card)
    }
  }
  
  draggingCard.value = null
  dragOffset.value = 0
}

// --- 收藏 & 截图 (核心修复：使用 .stop 防止触发 selectCard) ---
const isCollected = (card) => archive.value.some(i => i.title === card.title)
const saveAndCollect = async (card) => {
  console.log("点击收藏按钮:", card.title)
  
  if (isCollected(card)) {
    // 如果已收藏，则取消收藏
    console.log("卡片已收藏，执行取消收藏")
    archive.value = archive.value.filter(item => item.title !== card.title)
    showNotification(`已取消收藏 "${card.title}"`, 'info')
  } else {
    // 如果未收藏，则添加到收藏夹
    console.log("卡片未收藏，执行收藏")
    try {
      // 直接添加到收藏夹，不进行截图
      archive.value.unshift({
        ...card,
        date: new Date().toLocaleDateString(),
        id: Date.now()
      })
      showNotification(`已收藏 "${card.title}"`, 'info')
    } catch (error) {
      console.error("收藏失败:", error)
      showNotification("收藏失败，请重试", 'error')
    }
  }
  
  // 保存到本地存储
  localStorage.setItem('psych_archive', JSON.stringify(archive.value))
}

// --- 搜索相关方法 ---
// 处理搜索输入
const handleSearchInput = async () => {
  const query = searchQuery.value.trim()
  if (query.length === 0) {
    searchSuggestions.value = []
    showSuggestions.value = false
    return
  }
  
  // 如果输入长度小于2，不显示建议
  if (query.length < 2) {
    searchSuggestions.value = []
    showSuggestions.value = false
    return
  }
  
  // 根据输入过滤心理学概念
  const filteredConcepts = psychologyConcepts.filter(concept => 
    concept.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5) // 最多显示5个建议
  
  // 如果没有匹配的预定义概念，尝试从AI获取建议
  if (filteredConcepts.length === 0 && query.length >= 2) {
    try {
      // 调用AI获取搜索建议
      const aiSuggestions = await getSearchSuggestions(query)
      searchSuggestions.value = aiSuggestions
    } catch (error) {
      console.error('获取AI搜索建议失败:', error)
      // 如果AI建议失败，使用默认建议
      searchSuggestions.value = filteredConcepts
    }
  } else {
    searchSuggestions.value = filteredConcepts
  }
  
  showSuggestions.value = searchSuggestions.value.length > 0
}

// 选择搜索建议
const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  generateCardFromSearch()
}

// 根据搜索生成卡牌
const generateCardFromSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query || isGenerating.value) return
  
  isGenerating.value = true
  showSuggestions.value = false
  
  try {
    // 调用AI服务生成卡牌，使用专门的搜索函数
    const newCard = await getPsychologyCardFromSearch(query)
    
    // 检查是否与心理学相关
    if (newCard.isNotRelevant) {
      // 显示与心理学无关的提示
      showNotification(`搜索内容与心理学无关：${newCard.reason}`, 'warning')
      searchQuery.value = ''
      return
    }
    
    // 添加到卡牌列表的开头
    cards.value.unshift({
      ...newCard,
      id: Date.now(), // 使用时间戳作为唯一ID
      isRefreshing: false,
      isFetchingRelated: false
    })
    
    // 限制卡牌数量，保持最多10张
    if (cards.value.length > 10) {
      cards.value = cards.value.slice(0, 10)
    }
    
    // 选中新生成的卡牌
    selectedCard.value = cards.value[0]
    
    // 检查并处理重复的卡牌
    await checkAndUpdateDuplicateCards()
    
    // 清空搜索框
    searchQuery.value = ''
    
    // 保存到本地存储
    saveToLocalStorage()
    
  } catch (error) {
    console.error('生成卡牌失败:', error)
    // 显示错误提示
    showNotification('生成卡牌失败，请稍后再试', 'error')
  } finally {
    isGenerating.value = false
  }
}

// --- 数据刷新 ---
const updateCard = async (index) => {
  cards.value[index].isRefreshing = true
  // 获取所有现有标题，包括收藏夹中的标题，以避免重复
  const allExistingTitles = [
    ...cards.value.map(c => c.title),
    ...archive.value.map(a => a.title)
  ]
  
  // 尝试多次获取不重复的卡牌
  let data = null
  let attempts = 0
  const maxAttempts = 3 // 减少尝试次数，避免过长等待时间
  
  while (attempts < maxAttempts) {
    try {
      data = await getPsychologyCard(allExistingTitles, archive.value.length)
      
      // 检查是否重复
      const isDuplicate = allExistingTitles.includes(data?.title) || 
                         archive.value.some(a => a.similar === data?.similar) ||
                         cards.value.some(c => c.similar === data?.similar)
      
      if (!isDuplicate && data && data.title !== "连接超时") {
        break // 找到不重复的卡牌
      }
      
      attempts++
      console.log(`尝试 ${attempts}: 检测到重复卡牌或连接超时，重新生成...`)
    } catch (error) {
      console.error(`尝试 ${attempts} 失败:`, error)
      attempts++
    }
  }
  
  if (data && !allExistingTitles.includes(data.title)) {
    cards.value[index] = { ...data, id: Date.now() + index, isRefreshing: false, isFetchingRelated: false, isDragging: false, isDeleting: false, dragOffset: 0, wasDragged: false, hasMoved: false }
    localStorage.setItem('current_daily', JSON.stringify(cards.value))
    
    // 检查并处理重复的卡牌
    await checkAndUpdateDuplicateCards()
  } else {
    // 如果仍然无法获取不重复的卡牌，保持原卡牌并重置状态
    console.error("无法获取不重复的卡牌，保持原卡牌")
    cards.value[index].isRefreshing = false
    // 可以在这里添加一个通知，告知用户卡牌更新失败
  }
}
const refreshOne = (i) => updateCard(i)

const handleCardClick = (card) => {
  // 如果卡片正在拖动或刚刚完成拖动，不打开卡片
  if (card.isDragging || card.wasDragged) {
    // 重置拖动标记
    card.wasDragged = false
    card.hasMoved = false
    return
  }
  
  // 只有在没有拖拽的情况下才打开卡片
  if(!card.isRefreshing) {
    selectedCard.value = card
  }
}

// 延迟重置拖拽标记，确保不影响后续点击
const resetDragState = (card) => {
  setTimeout(() => {
    if (card && !card.isDragging) {
      card.wasDragged = false
      card.hasMoved = false
    }
  }, 100) // 100ms延迟，确保点击事件已经处理完毕
}

const selectCard = (card) => { 
  if(!card.isRefreshing) selectedCard.value = card 
}
const closeCard = () => { selectedCard.value = null }
const adjustFont = (d) => { baseFontSize.value = Math.max(18, Math.min(50, baseFontSize.value + d * 2)) }
const removeFromArchive = (itemOrIndex) => {
  if (typeof itemOrIndex === 'number') {
    archive.value.splice(itemOrIndex, 1);
  } else {
    archive.value = archive.value.filter(item => item.id !== itemOrIndex.id);
  }
  localStorage.setItem('psych_archive', JSON.stringify(archive.value));
}

// --- 收藏夹分类相关方法 ---
const filterArchive = (tag) => {
  activeFilter.value = tag
  // 切换筛选时自动展开所有分组
  if (tag === 'all') {
    expandedGroups.value = uniqueTags.value
  } else {
    expandedGroups.value = [tag]
  }
}

const toggleGroup = (tag) => {
  if (expandedGroups.value.includes(tag)) {
    expandedGroups.value = expandedGroups.value.filter(t => t !== tag)
  } else {
    expandedGroups.value.push(tag)
  }
}

// 查看收藏夹中的卡牌并以弹窗形式显示
const viewArchiveCard = (item) => {
  // 设置收藏夹卡牌并关闭收藏夹
  archiveCard.value = { 
    ...item, 
    id: Date.now(), 
    isFetchingRelated: false 
  }
  
  // 关闭收藏夹
  isArchiveOpen.value = false
    
  console.log("已打开收藏卡片弹窗:", item.title)
}

// 关闭收藏夹卡牌弹窗
const closeArchiveCard = () => {
  archiveCard.value = null
}

// --- 10,000个高性能粒子引擎 ---
let animationFrame
const initStarfield = () => {
  const canvas = document.getElementById('starfield')
  const ctx = canvas.getContext('2d')
  let stars = []
  const count = 20000 // 粒子数量

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    stars = []
    for(let i=0; i<count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: Math.random() * 0.8, // 粒子更小
        o: Math.random() * 0.5 + 0.5, // 增加亮度，范围0.5-1
        v: Math.random() * 0.2 // 基础速度
      })
    }
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 批量绘制优化：使用单一路径减少 CPU 消耗
    ctx.fillStyle = "white"
    for(let i=0; i<count; i++) {
      const s = stars[i]
      s.y -= s.v // 缓慢向上漂浮
      if(s.y < 0) s.y = canvas.height
      
      ctx.globalAlpha = s.o
      ctx.fillRect(s.x, s.y, s.s, s.s) // 使用 fillRect 代替 arc 性能提升 5 倍
    }
    animationFrame = requestAnimationFrame(draw)
  }

  window.addEventListener('resize', resize)
  resize(); draw()
}

// 确保始终保持5张卡牌
const ensureFiveCards = async () => {
  // 如果卡牌数量不足5张，添加新卡牌
  while (cards.value.length < 5) {
    const newCard = {
      title: '加载中...',
      tag: '心理学',
      brief: '正在生成内容',
      detail: '请稍候',
      story: '经典案例：加载中\n现代热点：加载中',
      usage: '现代应用1：加载中\n现代应用2：加载中',
      similar: '加载中',
      id: Date.now() + cards.value.length,
      isRefreshing: false,
      isFetchingRelated: false
    }
    cards.value.push(newCard)
    
    // 异步更新卡牌内容
    const index = cards.value.length - 1
    setTimeout(() => updateCard(index), 500)
  }
  
  // 如果卡牌数量超过5张，移除多余的
  if (cards.value.length > 5) {
    cards.value = cards.value.slice(0, 5)
    localStorage.setItem('current_daily', JSON.stringify(cards.value))
  }
}

// 检查两个卡牌内容是否相似
const isContentSimilar = (card1, card2) => {
  // 检查标题相似度（简单的包含关系）
  const title1 = card1.title.toLowerCase()
  const title2 = card2.title.toLowerCase()
  
  // 如果标题完全相同
  if (title1 === title2) return true
  
  // 如果一个标题包含另一个标题的关键词
  if (title1.includes(title2.substring(0, 3)) || title2.includes(title1.substring(0, 3))) {
    return true
  }
  
  // 检查brief内容相似度
  const brief1 = card1.brief.toLowerCase()
  const brief2 = card2.brief.toLowerCase()
  
  // 计算brief的相似度（简单的关键词重叠）
  const words1 = brief1.split(/[，。！？、\s]+/).filter(word => word.length > 1)
  const words2 = brief2.split(/[，。！？、\s]+/).filter(word => word.length > 1)
  
  // 如果有超过2个相同的关键词，认为是相似的
  let commonWords = 0
  for (const word of words1) {
    if (words2.includes(word)) {
      commonWords++
    }
  }
  
  return commonWords >= 2
}

// 检查并更新重复的卡牌
const checkAndUpdateDuplicateCards = async () => {
  const titleCount = new Map()
  const similarCount = new Map()
  const duplicateIndices = []
  
  // 统计每个标题和相似词出现的次数
  cards.value.forEach((card, index) => {
    titleCount.set(card.title, (titleCount.get(card.title) || 0) + 1)
    similarCount.set(card.similar, (similarCount.get(card.similar) || 0) + 1)
  })
  
  // 找出重复的卡牌索引（保留第一个，刷新后续的）
  cards.value.forEach((card, index) => {
    let isDuplicate = false
    let reason = ""
    
    // 检查标题或相似词是否重复
    if (titleCount.get(card.title) > 1) {
      // 检查是否是第一次出现
      let isFirstTitle = true
      for (let i = 0; i < index; i++) {
        if (cards.value[i].title === card.title) {
          isFirstTitle = false
          break
        }
      }
      
      if (!isFirstTitle) {
        isDuplicate = true
        reason = "标题重复"
      }
    }
    
    if (!isDuplicate && similarCount.get(card.similar) > 1) {
      // 检查是否是第一次出现
      let isFirstSimilar = true
      for (let i = 0; i < index; i++) {
        if (cards.value[i].similar === card.similar) {
          isFirstSimilar = false
          break
        }
      }
      
      if (!isFirstSimilar) {
        isDuplicate = true
        reason = "相似词重复"
      }
    }
    
    // 检查内容相似度
    if (!isDuplicate) {
      for (let i = 0; i < index; i++) {
        if (isContentSimilar(card, cards.value[i])) {
          isDuplicate = true
          reason = "内容相似"
          break
        }
      }
    }
    
    if (isDuplicate) {
      duplicateIndices.push(index)
      console.log(`发现重复卡牌: ${card.title}，位置: ${index}，原因: ${reason}，将刷新内容`)
    }
  })
  
  // 刷新重复的卡牌
  if (duplicateIndices.length > 0) {
    // 按照索引从大到小排序，避免索引变化问题
    duplicateIndices.sort((a, b) => b - a)
    
    for (const index of duplicateIndices) {
      console.log(`刷新重复卡牌，位置: ${index}`)
      await updateCard(index)
    }
  }
}

// 处理背景图片上传
const handleBackgroundUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  
  // 检查文件大小（限制为5MB）
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过5MB')
    return
  }
  
  const reader = new FileReader()
  reader.onload = async (e) => {
    const imageData = e.target.result
    customBackgroundImage.value = imageData
    localStorage.setItem('customBackgroundImage', imageData)
    
    // 分析图片亮度
    const isLight = await analyzeImageBrightness(imageData)
    isDarkBackground.value = !isLight
    
    console.log('背景图片已保存，亮度分析:', isLight ? '浅色' : '深色')
  }
  reader.readAsDataURL(file)
}

onMounted(async () => {
  initStarfield()
  const saved = localStorage.getItem('psych_archive')
  if (saved) archive.value = JSON.parse(saved)
  const daily = localStorage.getItem('current_daily')
  if (daily) {
    cards.value = JSON.parse(daily).map(c => ({...c, isRefreshing: false}))
    // 确保始终保持5张卡牌
    await ensureFiveCards()
    // 检查并更新重复的卡牌，而不是移除
    await checkAndUpdateDuplicateCards()
  } else {
    // 初始化时，确保避免与收藏夹内容重复
    // 延迟加载，避免同时发起过多请求
    cards.value.forEach((_, i) => {
      setTimeout(() => updateCard(i), i * 1000) // 增加到1秒间隔，减少API请求压力
    })
  }
  
  // 初始化收藏夹分组展开状态
  expandedGroups.value = uniqueTags.value
  
  // 添加全局点击事件监听器，用于关闭搜索建议
  document.addEventListener('click', (e) => {
    // 检查点击是否在搜索框或搜索建议区域外
    const searchContainer = e.target.closest('.relative.group')
    if (!searchContainer) {
      showSuggestions.value = false
    }
  })
})

// 获取关联内容
const fetchRelatedContent = async (relatedWord) => {
  if (!relatedWord) {
    console.error("关联词为空");
    return;
  }
  
  // 找到当前选中的卡片，优先检查收藏夹中的卡片
  let currentCard = archiveCard.value || selectedCard.value || cards.value.find(card => card.similar === relatedWord)
  if (!currentCard) {
    console.error("找不到对应的卡片");
    return;
  }
  
  // 如果已经有内容，不再重复获取
  if (currentCard.relatedContent) {
    console.log("关联内容已存在，不再重复获取");
    return;
  }
  
  // 设置加载状态
  currentCard.isFetchingRelated = true
  
  try {
    console.log("正在获取关联内容:", relatedWord)
    
    // 调用AI服务获取关联内容
    const content = await getQuickAnnotation(relatedWord)
    
    console.log("获取到的关联内容:", content)
    
    // 更新卡片内容
    currentCard.relatedContent = content
    
    // 保存到本地存储
    saveToLocalStorage()
  } catch (error) {
    console.error("获取关联内容失败:", error)
    currentCard.relatedContent = `获取关联内容时出错: ${error.message}`
  } finally {
    currentCard.isFetchingRelated = false
  }
}

// 保存数据到本地存储
const saveToLocalStorage = () => {
  try {
    localStorage.setItem('current_daily', JSON.stringify(cards.value))
    localStorage.setItem('archive', JSON.stringify(archive.value))
  } catch (error) {
    console.error("保存到本地存储失败:", error)
  }
}

// 检查卡片是否有第三个案例
const hasThirdCase = (card) => {
  return card && card.extraCase && card.extraCase.trim() !== ''
}

onUnmounted(() => cancelAnimationFrame(animationFrame))
</script>

<style scoped>
/* 卡片漂浮动画 */
.card-float { animation: float 6s ease-in-out infinite; }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* 悬停发光 */
.hover\:card-glow:hover {
  transform: translateY(-25px) scale(1.03) !important;
  box-shadow: 0 0 50px rgba(99, 102, 241, 0.4);
  border-color: rgba(255, 255, 255, 0.3);
  z-index: 30;
  animation-play-state: paused;
}

/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

/* 基础转场 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.animate-scale-in { animation: scaleIn 0.4s ease-out; }
@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.animate-slide-up { animation: slideUp 1s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
@keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
</style>