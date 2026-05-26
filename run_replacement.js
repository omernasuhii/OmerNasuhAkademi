const fs = require('fs');
const fileContent = fs.readFileSync('src/pages/admin/ServiceManagement.tsx', 'utf8');

const startIndex = fileContent.indexOf('      {showModal && (');
const endIndex = fileContent.lastIndexOf('    </div>\n  );\n}\n');

const newModal = `      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#f0f2f5] w-full h-full md:w-[95%] md:h-[95vh] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col font-sans"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <div className="mb-4 sm:mb-0">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                  <span className="hover:underline cursor-pointer" onClick={() => setShowModal(false)}>Randevulu Hizmetler</span> 
                  <span>&gt;</span> 
                  <span className="text-slate-800 font-bold">{formData.title || 'Yeni Hizmet'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{formData.title || 'Yeni Hizmet Oluştur'}</h2>
                  <div className="bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-md cursor-pointer flex items-center gap-1">
                    Randevu <ChevronDown size={14} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm"
                >
                  İptal
                </button>
                <button 
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center gap-2 text-sm"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  Kaydet
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 overflow-hidden h-full"> 
              {/* Sidebar */}
              <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 py-6 shrink-0">
                <nav className="flex flex-col">
                  {[
                    { id: 'details', label: 'Hizmet Detayları' },
                    { id: 'pricing', label: 'Fiyatlandırma ve ödeme' },
                    { id: 'staff', label: 'Personel' },
                    { id: 'resources', label: 'Kaynaklar ve odalar' },
                    { id: 'location', label: 'Konumlar' },
                    { id: 'preferences', label: 'Randevu tercihleri' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
                      className={\`text-left px-8 py-4 transition-colors text-sm \${activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600' : 'text-slate-600 font-medium hover:bg-slate-50 border-l-4 border-transparent'}\`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
                <div className="mt-auto px-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-600">Visible on your site and app</span>
                     <div 
                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                        className={\`w-10 h-5 rounded-full relative p-0.5 cursor-pointer transition-all \${formData.isActive ? 'bg-blue-600' : 'bg-slate-300'}\`}
                     >
                        <div className={\`w-4 h-4 bg-white rounded-full shadow-md transition-all \${formData.isActive ? 'translate-x-5' : 'translate-x-0'}\`}></div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Main Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* DETAIL TAB */}
                  {activeTab === 'details' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <h3 className="text-xl font-bold text-slate-900 mb-1">Hizmet detayları</h3>
                       <p className="text-sm text-slate-500 mb-8">Hizmetinize bir ad verin, bir slogan ve açıklama ekleyin.</p>

                       <div className="space-y-6">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Hizmet Kategorisi</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <button 
                                type="button"
                                onClick={() => setFormData({...formData, type: 'one-on-one', isRecurring: false})}
                                className={\`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all \${formData.type === 'one-on-one' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}\`}
                              >
                                <Users size={20} />
                                <span className="font-bold text-sm">Birebir Koçluk</span>
                              </button>
                              <button 
                                type="button"
                                onClick={() => setFormData({...formData, type: 'lesson', isRecurring: true})}
                                className={\`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all \${formData.type === 'lesson' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}\`}
                              >
                                <Clock size={20} />
                                <span className="font-bold text-sm">Grup Dersi</span>
                              </button>
                              <button 
                                type="button"
                                onClick={() => setFormData({...formData, type: 'course'})}
                                className={\`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all \${formData.type === 'course' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}\`}
                              >
                                <Repeat size={20} />
                                <span className="font-bold text-sm">Aylık Paket/Kurs</span>
                              </button>
                            </div>
                         </div>

                         <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">
                             Ad
                           </label>
                           <input 
                             type="text" 
                             value={formData.title}
                             onChange={e => setFormData({...formData, title: e.target.value})}
                             className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all" 
                             placeholder="Öğrenci Koçluğu"
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">
                             Açıklama (tercihe bağlı)
                           </label>
                           <textarea 
                             value={formData.description}
                             onChange={e => setFormData({...formData, description: e.target.value})}
                             className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all min-h-[120px]" 
                             placeholder="Ne sunduğunuzu ve müşterilerin nasıl bir fayda göreceğini açıklayın."
                           />
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1 text-blue-600 flex items-center gap-1">
                               Süre (Dakika)
                             </label>
                             <input 
                               type="number" 
                               step="5"
                               value={formData.duration}
                               onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                               className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium" 
                             />
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1 text-slate-500 flex items-center gap-1">
                               Dinlenme süresi (DK)
                             </label>
                             <input 
                               type="number" 
                               step="5"
                               value={formData.bufferTime}
                               onChange={e => setFormData({...formData, bufferTime: parseInt(e.target.value)})}
                               className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all" 
                             />
                           </div>
                         </div>
                       </div>
                    </div>
                  )}

                  {/* PRICING TAB */}
                  {activeTab === 'pricing' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <h3 className="text-xl font-bold text-slate-900 mb-1">Ücret ve ödeme</h3>
                       <p className="text-sm text-slate-500 mb-8">Bir ücret belirleyin ve ödeme tercihinizi seçin.</p>
                       
                       <div className="space-y-8">
                         <div>
                            <label className="block text-sm font-bold text-slate-900 mb-4">Müşterilerin bu hizmet için ne şekilde ödeme yapabileceklerini seçin</label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                               <div className="p-4 rounded-xl border border-slate-200 text-center opacity-70">
                                 <h4 className="font-bold text-slate-900 mb-1">Seans başına</h4>
                                 <p className="text-xs text-slate-500">Müşteriler, belirlediğiniz ücrete göre seans başına ödeme yapar</p>
                               </div>
                               <div className="p-4 rounded-xl border border-slate-200 text-center opacity-70">
                                 <h4 className="font-bold text-slate-900 mb-1">Plan ile</h4>
                                 <p className="text-xs text-slate-500">Müşteriler, yer ayırtmak için üyelik veya paket satın alır</p>
                               </div>
                               <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/30 text-center relative">
                                 <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-0.5">
                                    <CheckCircle size={16} className="fill-blue-600 stroke-white" />
                                 </div>
                                 <h4 className="font-bold text-slate-900 mb-1">Seans başına veya plan ile</h4>
                                 <p className="text-xs text-slate-500">Müşteriler seans başına ücret, üyelik veya paket ile ödeme yapar</p>
                               </div>
                            </div>
                         </div>

                         <div className="pt-2">
                           <h4 className="font-bold text-slate-900 mb-4">Seans başına ücret</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ücret türü</label>
                                <select 
                                   value={formData.variablePricingEnabled ? 'variable' : 'fixed'}
                                   onChange={e => setFormData({...formData, variablePricingEnabled: e.target.value === 'variable'})}
                                   className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                                >
                                   <option value="fixed">Sabit ücret</option>
                                   <option value="variable">Değişken ücretlendirme</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Varsayılan tutar</label>
                                <div className="relative">
                                   <span className="absolute left-3 top-3 text-slate-500">₺</span>
                                   <input 
                                     type="number" 
                                     value={formData.basePrice}
                                     onChange={e => setFormData({...formData, basePrice: parseInt(e.target.value)})}
                                     className="w-full bg-white border border-slate-300 rounded-lg p-3 pl-8 text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                   />
                                </div>
                             </div>
                           </div>
                         </div>

                         {/* Variable pricing for One-on-one */}
                         {formData.variablePricingEnabled && (
                           <div className="mt-6">
                             <div className="flex items-center justify-between mb-4">
                                <span className="font-bold text-slate-900">Varyasyonlar</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVariation = { criteria: 'coach', targetId: '', price: formData.basePrice || 0 };
                                    setFormData({...formData, pricingVariations: [...(formData.pricingVariations || []), newVariation]});
                                  }}
                                  className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition-colors inline-block"
                                >
                                  Varyasyonları Yönet
                                </button>
                             </div>

                             <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                                <div className="grid grid-cols-2 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                                   <div>Sınıf Seviyesi / Personel</div>
                                   <div>Ücret</div>
                                </div>
                                {(formData.pricingVariations || []).map((variation: any, idx: number) => (
                                  <div key={idx} className="grid grid-cols-2 px-4 py-4 items-center hover:bg-slate-50 transition-colors">
                                     <div className="flex items-center gap-2">
                                        <select
                                          value={variation.criteria}
                                          onChange={e => {
                                            const updated = [...(formData.pricingVariations || [])];
                                            updated[idx].criteria = e.target.value;
                                            setFormData({...formData, pricingVariations: updated});
                                          }}
                                          className="bg-transparent text-sm font-medium text-slate-800 outline-none w-auto max-w-[100px]"
                                        >
                                          <option value="coach">Personel</option>
                                          <option value="duration">Seviye/Süre</option>
                                        </select>
                                        {variation.criteria === 'coach' ? (
                                          <select
                                            value={variation.targetId}
                                            onChange={e => {
                                              const updated = [...(formData.pricingVariations || [])];
                                              updated[idx].targetId = e.target.value;
                                              setFormData({...formData, pricingVariations: updated});
                                            }}
                                             className="bg-transparent text-sm font-medium text-slate-800 outline-none flex-1 max-w-[150px]"
                                          >
                                            <option value="">Seçiniz</option>
                                            {coaches.map(c => <option key={c.uid} value={c.uid}>{c.displayName}</option>)}
                                          </select>
                                        ) : (
                                          <input 
                                            type="text" 
                                            value={variation.targetId}
                                            onChange={e => {
                                              const updated = [...(formData.pricingVariations || [])];
                                              updated[idx].targetId = e.target.value;
                                              setFormData({...formData, pricingVariations: updated});
                                            }}
                                            className="bg-transparent text-sm font-medium text-slate-800 outline-none w-full"
                                            placeholder="rn: YKS, LGS"
                                          />
                                        )}
                                     </div>
                                     <div className="flex items-center justify-between ml-auto w-full pl-8">
                                        <div className="flex items-center">
                                          <span className="text-slate-500 text-sm mr-1">₺</span>
                                          <input 
                                            type="number" 
                                            value={variation.price}
                                            onChange={e => {
                                              const updated = [...(formData.pricingVariations || [])];
                                              updated[idx].price = parseInt(e.target.value) || 0;
                                              setFormData({...formData, pricingVariations: updated});
                                            }}
                                            className="bg-transparent text-sm text-slate-800 outline-none w-20"
                                          />
                                        </div>
                                        <button 
                                          type="button" 
                                          onClick={() => {
                                            const updated = [...(formData.pricingVariations || [])];
                                            updated.splice(idx, 1);
                                            setFormData({...formData, pricingVariations: updated});
                                          }}
                                          className="text-blue-500 p-2 hover:bg-blue-50 rounded-full"
                                          title="Düzenle / Sil"
                                        >
                                          <Edit3 size={16} />
                                        </button>
                                     </div>
                                  </div>
                                ))}
                                {(formData.pricingVariations?.length === 0) && (
                                   <div className="px-4 py-8 text-center text-sm text-slate-500">Henüz varyasyon eklenmedi.</div>
                                )}
                             </div>
                           </div>
                         )}

                         <div className="mt-8">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Ödeme tercihleri</label>
                            <select 
                               value={formData.paymentTypes?.includes('cash') ? 'all' : 'online'}
                               onChange={(e) => {
                                  if (e.target.value === 'all') setFormData({...formData, paymentTypes: ['cash', 'subscription']});
                                  else setFormData({...formData, paymentTypes: ['subscription']});
                               }}
                               className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                            >
                               <option value="all">Tüm tutar online/şahsen ödenir</option>
                               <option value="online">Tüm tutar online ödenir (Kredi Kartı)</option>
                            </select>
                         </div>
                       </div>
                    </div>
                  )}

                  {/* STAFF TAB */}
                  {activeTab === 'staff' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Atanan personel</h3>
                        <p className="text-sm text-slate-500 mb-8">Bu hizmeti sunacak personel üyelerini seçin.</p>

                        <div className="space-y-4">
                           <div className="p-1 border-b border-slate-200 pb-8 flex flex-col gap-4">
                              <div className="flex flex-wrap gap-2 mb-2">
                                 {formData.assignedCoachIds?.map(id => {
                                   const c = coaches.find(c => c.uid === id);
                                   if (!c) return null;
                                   return (
                                     <div key={id} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200">
                                       <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-[10px] text-white">
                                          {c.displayName.charAt(0)}
                                       </div>
                                       {c.displayName}
                                       <XCircle 
                                         size={16} 
                                         className="cursor-pointer text-slate-400 hover:text-slate-600 ml-1" 
                                         onClick={() => {
                                            const updated = formData.assignedCoachIds?.filter(x => x !== id);
                                            setFormData({...formData, assignedCoachIds: updated});
                                         }}
                                       />
                                     </div>
                                   )
                                 })}
                              </div>
                              <select 
                                onChange={e => {
                                  if(!e.target.value) return;
                                  const current = formData.assignedCoachIds || [];
                                  if(!current.includes(e.target.value)) {
                                    setFormData({...formData, assignedCoachIds: [...current, e.target.value]});
                                  }
                                  e.target.value = "";
                                }}
                                className="w-full bg-white border border-slate-300 text-slate-600 rounded-lg p-3 outline-none focus:border-blue-500"
                              >
                                <option value="">Personel üyelerini arayın veya seçin</option>
                                {coaches.map(c => <option key={c.uid} value={c.uid}>{c.displayName}</option>)}
                              </select>
                           </div>

                           <div className="flex items-center justify-between text-sm py-2">
                              <span className="text-slate-700 flex items-center gap-2"><Settings size={18} className="text-slate-400"/> Hizmetin müsaitliği, personel üyesinin çalışma saatlerine bağlıdır.</span>
                              <span className="text-blue-600 font-bold hover:underline cursor-pointer">Müsaitliği Göster</span>
                           </div>
                        </div>
                    </div>
                  )}

                  {/* RESOURCES TAB */}
                  {activeTab === 'resources' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xl font-bold text-slate-900">Kaynaklar ve odalar</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-8">Müşterilerin bu hizmette yer ayırtabilmesi için müsaitliği gerekli olan kaynaklar atayın.</p>

                        <div className="space-y-4">
                           <div className="flex items-center justify-between mb-4">
                              <label className="block text-sm font-medium text-slate-700">Bu hizmet için gerekli kaynak türlerini seçin.</label>
                              <button className="text-xs font-bold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-4 py-1.5 rounded-full transition-colors">Kaynakları Yönet</button>
                           </div>
                           <div className="flex flex-col">
                              {rooms.map((room, idx) => (
                                 <label key={room.id} className={\`flex items-center gap-3 py-4 cursor-pointer group border-slate-100 \${idx !== 0 ? 'border-t' : ''}\`}>
                                    <input 
                                      type="checkbox"
                                      checked={formData.assignedRoomIds?.includes(room.id!)}
                                      onChange={() => {
                                        const current = formData.assignedRoomIds || [];
                                        const updated = current.includes(room.id!) ? current.filter(id => id !== room.id) : [...current, room.id!];
                                        setFormData({...formData, assignedRoomIds: updated});
                                      }}
                                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                    />
                                    <div className="flex items-center gap-3">
                                       <span className="text-base font-medium text-slate-700">{room.name}</span>
                                       <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-medium">{room.capacity} Kaynak</span>
                                    </div>
                                 </label>
                              ))}
                           </div>
                        </div>
                    </div>
                  )}

                  {/* LOCATION TAB */}
                  {activeTab === 'location' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Konumlar</h3>
                        <p className="text-sm text-slate-500 mb-8">Hizmetin sağlanacağı konumu belirleyin.</p>

                        <div className="space-y-6">
                           <div className="flex flex-col gap-3">
                              {[
                                { id: 'default', label: 'Merkez (Şube)' },
                                { id: 'custom', label: 'Özel Konum' },
                                { id: 'student_address', label: 'Öğrenci Adresi' }
                              ].map(loc => (
                                <label key={loc.id} className={\`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all \${formData.locationType === loc.id ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'}\`}>
                                   <input 
                                     type="radio"
                                     name="location"
                                     checked={formData.locationType === loc.id}
                                     onChange={() => setFormData({...formData, locationType: loc.id as any})}
                                     className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-slate-300"
                                   />
                                   <div>
                                      <div className="font-bold text-slate-800">{loc.label}</div>
                                   </div>
                                </label>
                              ))}
                           </div>

                           {formData.locationType === 'custom' && (
                              <div className="pt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Özel Konum Adresi</label>
                                <input 
                                  type="text"
                                  value={formData.customLocation}
                                  onChange={e => setFormData({...formData, customLocation: e.target.value})}
                                  placeholder="Açık adres girin"
                                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                              </div>
                           )}

                           {/* Online Option */}
                           <div className="mt-8 pt-8 border-t border-slate-200">
                             <div className="flex items-center justify-between">
                               <div>
                                 <h4 className="font-bold text-slate-900 flex items-center gap-2"><Video size={18} className="text-blue-500" /> Videokonferans</h4>
                                 <p className="text-sm text-slate-500 mt-1">Hizmet online olarak sunulsun.</p>
                               </div>
                               <div 
                                  onClick={() => setFormData({...formData, isOnlineAvailable: !formData.isOnlineAvailable})}
                                  className={\`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-all \${formData.isOnlineAvailable ? 'bg-blue-600' : 'bg-slate-300'}\`}
                                >
                                  <div className={\`w-5 h-5 bg-white rounded-full shadow-md transition-all \${formData.isOnlineAvailable ? 'translate-x-5' : 'translate-x-0'}\`}></div>
                                </div>
                             </div>
                           </div>
                        </div>
                    </div>
                  )}

                  {/* PREFERENCES TAB */}
                  {activeTab === 'preferences' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Randevu tercihleri</h3>
                        <p className="text-sm text-slate-500 mb-8">Randevu formu ekleyin, politika belirleyin ve online randevuları kabul edin.</p>

                        <div className="space-y-8">
                           {/* Policy */}
                           <div>
                              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1">Randevu politikası <span className="text-blue-500" title="Info">ⓘ</span></h4>
                              <p className="text-xs text-slate-500 mb-3">Bu hizmete hangi politikayı bağlamak istediğinizi seçin.</p>
                              <div className="flex gap-4 items-center">
                                 <select className="flex-1 bg-white border border-slate-300 text-slate-900 font-medium rounded-lg p-3 outline-none">
                                    <option>Varsayılan Politika</option>
                                 </select>
                                 <button className="text-blue-600 font-bold text-sm bg-blue-50 hover:bg-blue-100 flex items-center gap-2 px-4 py-3 rounded-lg border border-blue-100">
                                   <Edit3 size={16} /> Politikayı Düzenle
                                 </button>
                              </div>
                           </div>

                           <div className="flex items-center justify-between p-6 border border-slate-200 rounded-xl">
                               <div>
                                 <h4 className="font-bold text-slate-900">Online randevular</h4>
                                 <p className="text-sm text-slate-500 mt-1">Müşterilere sitenizden randevu alma imkanı tanıyın.</p>
                               </div>
                               <div 
                                  onClick={() => setFormData({...formData, allowOnlineRequest: !formData.allowOnlineRequest})}
                                  className={\`w-12 h-6 rounded-full relative p-0.5 cursor-pointer transition-all \${formData.allowOnlineRequest ? 'bg-blue-600' : 'bg-slate-300'}\`}
                                >
                                  <div className={\`w-5 h-5 bg-white rounded-full shadow-md transition-all mt-[2px] \${formData.allowOnlineRequest ? 'translate-x-6' : 'translate-x-0'}\`}></div>
                                </div>
                             </div>

                           {/* Online Appr */}
                           <div className="pt-2">
                              <h4 className="font-bold text-slate-900 mb-4">Randevu talepleri</h4>
                              <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200">
                                <label className={\`flex items-center gap-3 p-4 cursor-pointer transition-colors \${formData.approvalType === 'automatic' ? 'bg-blue-50' : 'hover:bg-slate-50'}\`}>
                                   <input 
                                      type="radio" 
                                      checked={formData.approvalType === 'automatic'}
                                      onChange={() => setFormData({...formData, approvalType: 'automatic'})}
                                      className="w-4 h-4 text-blue-600"
                                   />
                                   <span className="text-sm font-medium text-slate-800">Müsaitliğe göre tüm randevuları otomatik olarak kabul edin</span>
                                </label>
                                <label className={\`flex items-center gap-3 p-4 border-t border-slate-200 cursor-pointer transition-colors \${formData.approvalType === 'manual' ? 'bg-blue-50' : 'hover:bg-slate-50'}\`}>
                                   <input 
                                      type="radio" 
                                      checked={formData.approvalType === 'manual'}
                                      onChange={() => setFormData({...formData, approvalType: 'manual'})}
                                      className="w-4 h-4 text-blue-600"
                                   />
                                   <span className="text-sm font-medium text-slate-800">Randevu isteklerini manuel olarak onaylayın veya reddedin</span>
                                </label>
                              </div>
                           </div>

                           {(formData.type === 'lesson' || formData.type === 'course') && (
                              <div className="pt-4">
                                <div className="space-y-4 w-full">
                                  <div className="grid grid-cols-2 gap-4">
                                     <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Maksimum Katılımcı</label>
                                       <input 
                                         type="number"
                                         value={formData.maxParticipants}
                                         onChange={e => setFormData({...formData, maxParticipants: parseInt(e.target.value)})}
                                         className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                       />
                                     </div>
                                     <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Tek Talepte Max Kişi</label>
                                       <input 
                                         type="number"
                                         value={formData.maxPeoplePerRequest}
                                         onChange={e => setFormData({...formData, maxPeoplePerRequest: parseInt(e.target.value)})}
                                         className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                       />
                                     </div>
                                  </div>
                                  {formData.type === 'course' && (
                                     <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl mt-4">
                                        <div className="text-sm font-medium text-slate-800">Tekrarlı Plan (Her Hafta Devam Eder)</div>
                                        <div 
                                          onClick={() => setFormData({...formData, isRecurring: !formData.isRecurring})}
                                          className={\`w-12 h-6 rounded-full relative p-0.5 cursor-pointer transition-all \${formData.isRecurring ? 'bg-blue-600' : 'bg-slate-300'}\`}
                                        >
                                          <div className={\`w-5 h-5 bg-white rounded-full mt-[2px] shadow-md transition-all \${formData.isRecurring ? 'translate-x-6' : 'translate-x-0'}\`}></div>
                                        </div>
                                     </div>
                                  )}
                                </div>
                              </div>
                           )}

                        </div>
                    </div>
                  )}

                  {/* Spacer for bottom */}
                  <div className="h-20"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}`;

const replacementCode = fileContent.substring(0, startIndex) + newModal + fileContent.substring(endIndex + '    </div>\n  );\n}\n'.length) + '    </div>\n  );\n}';

fs.writeFileSync('src/pages/admin/ServiceManagement.tsx', replacementCode);
