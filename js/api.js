// ============================================================================
// API.JS - Centralized Database API Layer
// PPG SORONG
// ============================================================================
// File ini menyediakan semua fungsi untuk akses database
// Semua halaman harus menggunakan file ini untuk query database
// ============================================================================

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle API error dengan konsisten
 */
function handleApiError(error, customMessage = 'Terjadi kesalahan') {
    console.error('API Error:', error);
    var message = '';
    if (error && error.message) {
        message = error.message;
    } else if (error && error.details) {
        message = error.details;
    } else if (typeof error === 'string') {
        message = error;
    } else {
        message = 'Unknown error';
    }
    
    // Log full error for debugging
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    if (typeof showToast === 'function') {
        showToast(customMessage + ': ' + message, 'error');
    }
    
    // Don't re-throw, just return the error for handling
    return { error: true, message: message };
}

/**
 * Safe parse integer, return null jika invalid
 */
function safeInt(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
}

/**
 * Build query dengan filters
 */
function applyFilters(query, filters = {}) {
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            query = query.eq(key, value);
        }
    });
    return query;
}

// ============================================================================
// JAMAAH API
// ============================================================================

const jamaahApi = {
    /**
     * Get semua jamaah dengan filter opsional
     * @param {Object} filters - { status_aktif, wilayah_id, jenjang_id, search }
     * @returns {Promise<Array>}
     */
    getAll: async function(filters = {}) {
        try {
            let query = db.from('v_jamaah_lengkap').select('*');
            
            if (filters.status_aktif) {
                query = query.eq('status_aktif', filters.status_aktif);
            }
            if (filters.wilayah_id) {
                query = query.eq('wilayah_id', safeInt(filters.wilayah_id));
            }
            if (filters.jenjang_id) {
                query = query.eq('jenjang_id', safeInt(filters.jenjang_id));
            }
            if (filters.desa_id) {
                query = query.eq('desa_id', safeInt(filters.desa_id));
            }
            if (filters.daerah_id) {
                query = query.eq('daerah_id', safeInt(filters.daerah_id));
            }
            
            query = query.order('nama');
            
            const { data, error } = await query;
            if (error) throw error;
            
            // Client-side search filter
            let result = data || [];
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                result = result.filter(j => 
                    (j.nama && j.nama.toLowerCase().includes(searchLower)) ||
                    (j.nama_panggilan && j.nama_panggilan.toLowerCase().includes(searchLower)) ||
                    (j.nomor_induk && j.nomor_induk.toLowerCase().includes(searchLower))
                );
            }
            
            return result;
        } catch (error) {
            handleApiError(error, 'Gagal memuat data jamaah');
            return [];
        }
    },

    /**
     * Search jamaah by nama (untuk pencarian pasangan dll)
     * @param {string} query - Kata kunci pencarian
     * @param {number} limit - Maksimal hasil
     * @returns {Promise<Array>}
     */
    search: async function(query, limit = 20) {
        try {
            if (!query || query.length < 2) return [];

            const { data, error } = await db
                .from('v_jamaah_lengkap')
                .select('id, nama, nama_panggilan, jenis_kelamin, tanggal_lahir, wilayah_nama, jenjang_nama, status_aktif')
                .or(`nama.ilike.%${query}%,nama_panggilan.ilike.%${query}%`)
                .order('nama')
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal mencari jamaah');
            return [];
        }
    },

    /**
     * Get jamaah by ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    getById: async function(id) {
        try {
            const { data, error } = await db
                .from('v_jamaah_lengkap')
                .select('*')
                .eq('id', safeInt(id))
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal memuat data jamaah');
            return null;
        }
    },

    /**
     * Get jamaah detail (raw dari tabel jamaah)
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    getDetailById: async function(id) {
        try {
            const { data, error } = await db
                .from('jamaah')
                .select('*')
                .eq('id', safeInt(id))
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal memuat detail jamaah');
            return null;
        }
    },

    /**
     * Create jamaah baru menggunakan stored procedure
     * @param {Object} jamaahData - { nama, jenis_kelamin, tanggal_lahir, alamat, phone }
     * @returns {Promise<number|null>} - ID jamaah baru
     */
    create: async function(jamaahData) {
        try {
            const { data, error } = await db.rpc('sp_daftar_jamaah_baru', {
                p_nama: jamaahData.nama,
                p_jenis_kelamin: jamaahData.jenis_kelamin,
                p_tanggal_lahir: jamaahData.tanggal_lahir,
                p_alamat: jamaahData.alamat_lengkap || jamaahData.alamat || null,
                p_phone: jamaahData.phone || null,
                p_created_by: jamaahData.created_by || null
            });
            
            if (error) throw error;
            return data; // Returns jamaah ID
        } catch (error) {
            handleApiError(error, 'Gagal menambah jamaah');
            return null;
        }
    },

    /**
     * Update jamaah
     * @param {number} id
     * @param {Object} jamaahData
     * @returns {Promise<boolean>}
     */
    update: async function(id, jamaahData) {
        try {
            // Filter hanya field yang valid untuk tabel jamaah
            var validFields = [
                'nama', 'nama_panggilan', 'jenis_kelamin', 'tempat_lahir',
                'tanggal_lahir', 'golongan_darah', 'phone', 'email',
                'alamat_lengkap', 'status_domisili', 'nomor_kk',
                'pendidikan_terakhir', 'pekerjaan', 'penghasilan_range',
                'foto_url', 'status_aktif', 'keterangan',
                'ayah_id', 'ibu_id'
            ];
            
            var updateData = {};
            validFields.forEach(function(field) {
                if (jamaahData[field] !== undefined) {
                    updateData[field] = jamaahData[field];
                }
            });
            updateData.updated_at = new Date().toISOString();
            
            console.log('Updating jamaah ID:', id, 'Data:', updateData);
            
            var result = await db
                .from('jamaah')
                .update(updateData)
                .eq('id', safeInt(id))
                .select();
            
            console.log('Update result:', result);
            
            if (result.error) {
                console.error('Update error:', result.error);
                if (typeof showToast === 'function') {
                    showToast('Gagal update: ' + (result.error.message || result.error.details || 'Unknown error'), 'error');
                }
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Update exception:', error);
            handleApiError(error, 'Gagal mengupdate jamaah');
            return false;
        }
    },

    /**
     * Update status jamaah menggunakan stored procedure
     * @param {number} id
     * @param {string} statusBaru
     * @param {string} keterangan
     * @returns {Promise<boolean>}
     */
    updateStatus: async function(id, statusBaru, keterangan = null) {
        try {
            const { data, error } = await db.rpc('sp_update_status_jamaah', {
                p_jamaah_id: safeInt(id),
                p_status_baru: statusBaru,
                p_keterangan: keterangan,
                p_updated_by: currentUserData?.id || null
            });

            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal mengupdate status');
            return false;
        }
    },

    /**
     * Update status jamaah menjadi menikah tanpa pasangan (pasangan bisa diisi nanti)
     * @param {number} jamaahId - ID jamaah
     * @param {string} tanggalMenikah - Tanggal menikah (opsional, default hari ini)
     * @returns {Promise<boolean>}
     */
    updateStatusMenikah: async function(jamaahId, tanggalMenikah = null) {
        try {
            const tglMenikah = tanggalMenikah || new Date().toISOString().split('T')[0];

            const { error } = await db
                .from('jamaah')
                .update({
                    status_aktif: 'menikah',
                    tanggal_menikah: tglMenikah,
                    keterangan: 'Menikah (pasangan belum diinput)',
                    updated_at: new Date().toISOString()
                })
                .eq('id', safeInt(jamaahId));

            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menyimpan status menikah');
            return false;
        }
    },

    /**
     * Menikahkan jamaah dengan pasangan
     * @param {number} jamaahId - ID jamaah yang akan dinikahkan
     * @param {number} pasanganId - ID pasangan
     * @param {string} tanggalMenikah - Tanggal menikah (opsional, default hari ini)
     * @returns {Promise<boolean>}
     */
    menikahkan: async function(jamaahId, pasanganId, tanggalMenikah = null) {
        try {
            // Update status kedua jamaah menjadi menikah dan set pasangan_id
            // Gunakan tanggal yang diberikan atau default ke hari ini
            const tglMenikah = tanggalMenikah || new Date().toISOString().split('T')[0];

            // Update jamaah pertama
            const { error: error1 } = await db
                .from('jamaah')
                .update({
                    status_aktif: 'menikah',
                    pasangan_id: safeInt(pasanganId),
                    tanggal_menikah: tglMenikah,
                    updated_at: new Date().toISOString()
                })
                .eq('id', safeInt(jamaahId));

            if (error1) throw error1;

            // Update jamaah kedua (pasangan)
            const { error: error2 } = await db
                .from('jamaah')
                .update({
                    status_aktif: 'menikah',
                    pasangan_id: safeInt(jamaahId),
                    tanggal_menikah: tglMenikah,
                    updated_at: new Date().toISOString()
                })
                .eq('id', safeInt(pasanganId));

            if (error2) throw error2;

            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menyimpan data pernikahan');
            return false;
        }
    },

    /**
     * Delete jamaah
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    delete: async function(id) {
        try {
            // Hapus enrollment dulu
            await db.from('enrollment').delete().eq('jamaah_id', safeInt(id));
            // Hapus fase_kehidupan
            await db.from('fase_kehidupan').delete().eq('jamaah_id', safeInt(id));
            // Hapus progress
            await db.from('progress_jamaah').delete().eq('jamaah_id', safeInt(id));
            // Hapus jamaah
            const { error } = await db.from('jamaah').delete().eq('id', safeInt(id));
            
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menghapus jamaah');
            return false;
        }
    },

    /**
     * Count jamaah dengan filter
     * @param {Object} filters
     * @returns {Promise<number>}
     */
    count: async function(filters = {}) {
        try {
            let query = db.from('jamaah').select('*', { count: 'exact', head: true });
            
            if (filters.status_aktif) {
                query = query.eq('status_aktif', filters.status_aktif);
            }
            
            const { count, error } = await query;
            if (error) throw error;
            return count || 0;
        } catch (error) {
            handleApiError(error, 'Gagal menghitung jamaah');
            return 0;
        }
    }
};

// ============================================================================
// GENERUS API
// ============================================================================

const generusApi = {
    /**
     * Get semua generus (jamaah belum menikah) dengan filter
     * @param {Object} filters - { wilayah_id, jenjang_id, status, search }
     * @returns {Promise<Array>}
     */
    getAll: async function(filters = {}) {
        try {
            // Gunakan stored procedure
            const { data, error } = await db.rpc('get_generus_by_wilayah', {
                p_wilayah_id: safeInt(filters.wilayah_id),
                p_jenjang_id: safeInt(filters.jenjang_id),
                p_status: filters.status || 'aktif'
            });
            
            if (error) throw error;
            
            // Client-side search filter
            let result = data || [];
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                result = result.filter(g => 
                    (g.nama && g.nama.toLowerCase().includes(searchLower)) ||
                    (g.nama_panggilan && g.nama_panggilan.toLowerCase().includes(searchLower))
                );
            }
            
            return result;
        } catch (error) {
            handleApiError(error, 'Gagal memuat data generus');
            return [];
        }
    },

    /**
     * Get generus dari view (alternatif)
     * @param {Object} filters
     * @returns {Promise<Array>}
     */
    getFromView: async function(filters = {}) {
        try {
            let query = db.from('v_generus_aktif').select('*');
            
            if (filters.kelompok_id) {
                query = query.eq('kelompok_id', safeInt(filters.kelompok_id));
            }
            if (filters.desa_id) {
                query = query.eq('desa_id', safeInt(filters.desa_id));
            }
            if (filters.daerah_id) {
                query = query.eq('daerah_id', safeInt(filters.daerah_id));
            }
            if (filters.jenjang_id) {
                query = query.eq('jenjang_id', safeInt(filters.jenjang_id));
            }
            
            query = query.order('nama');
            
            const { data, error } = await query;
            if (error) throw error;
            
            // Client-side search
            let result = data || [];
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                result = result.filter(g => 
                    (g.nama && g.nama.toLowerCase().includes(searchLower)) ||
                    (g.nama_panggilan && g.nama_panggilan.toLowerCase().includes(searchLower))
                );
            }
            
            return result;
        } catch (error) {
            handleApiError(error, 'Gagal memuat data generus');
            return [];
        }
    }
};

// ============================================================================
// ENROLLMENT API
// ============================================================================

const enrollmentApi = {
    /**
     * Get enrollment aktif untuk jamaah
     * @param {number} jamaahId
     * @returns {Promise<Object|null>}
     */
    getActiveByJamaah: async function(jamaahId) {
        try {
            const { data, error } = await db
                .from('enrollment')
                .select('*, jenjang:jenjang_id(id, nama, kode), wilayah:wilayah_id(id, nama, tingkat)')
                .eq('jamaah_id', safeInt(jamaahId))
                .eq('status', 'aktif')
                .single();
            
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return data || null;
        } catch (error) {
            handleApiError(error, 'Gagal memuat enrollment');
            return null;
        }
    },

    /**
     * Pindah kelompok menggunakan stored procedure
     * @param {number} jamaahId
     * @param {number} wilayahBaruId
     * @param {number} jenjangBaruId (optional)
     * @param {string} keterangan (optional)
     * @returns {Promise<number|null>} - ID enrollment baru
     */
    pindahKelompok: async function(jamaahId, wilayahBaruId, jenjangBaruId = null, keterangan = null) {
        try {
            const { data, error } = await db.rpc('sp_pindah_kelompok', {
                p_jamaah_id: safeInt(jamaahId),
                p_wilayah_baru_id: safeInt(wilayahBaruId),
                p_jenjang_baru_id: safeInt(jenjangBaruId),
                p_keterangan: keterangan,
                p_updated_by: currentUserData?.id || null
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal pindah kelompok');
            return null;
        }
    },

    /**
     * Update enrollment
     * @param {number} id
     * @param {Object} enrollmentData
     * @returns {Promise<boolean>}
     */
    update: async function(id, enrollmentData) {
        try {
            const updateData = { ...enrollmentData, updated_at: new Date().toISOString() };
            
            const { error } = await db
                .from('enrollment')
                .update(updateData)
                .eq('id', safeInt(id));
            
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal mengupdate enrollment');
            return false;
        }
    },

    /**
     * Update jenjang saja
     * @param {number} enrollmentId
     * @param {number} jenjangId
     * @returns {Promise<boolean>}
     */
    updateJenjang: async function(enrollmentId, jenjangId) {
        try {
            const { error } = await db
                .from('enrollment')
                .update({ 
                    jenjang_id: safeInt(jenjangId),
                    updated_at: new Date().toISOString()
                })
                .eq('id', safeInt(enrollmentId));
            
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal mengupdate jenjang');
            return false;
        }
    },

    /**
     * Create enrollment baru
     * @param {Object} enrollmentData
     * @returns {Promise<Object|null>}
     */
    create: async function(enrollmentData) {
        try {
            // Get tahun ajaran aktif jika tidak disediakan
            if (!enrollmentData.tahun_ajaran_id) {
                const { data: ta } = await db
                    .from('tahun_ajaran')
                    .select('id')
                    .eq('is_aktif', true)
                    .single();
                enrollmentData.tahun_ajaran_id = ta?.id;
            }
            
            const { data, error } = await db
                .from('enrollment')
                .insert({
                    jamaah_id: safeInt(enrollmentData.jamaah_id),
                    wilayah_id: safeInt(enrollmentData.wilayah_id),
                    jenjang_id: safeInt(enrollmentData.jenjang_id),
                    tahun_ajaran_id: safeInt(enrollmentData.tahun_ajaran_id),
                    tanggal_mulai: enrollmentData.tanggal_mulai || new Date().toISOString().split('T')[0],
                    status: 'aktif',
                    created_by: currentUserData?.id || null
                })
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal membuat enrollment');
            return null;
        }
    }
};

// ============================================================================
// PENGAJIAN API
// ============================================================================

const pengajianApi = {
    /**
     * Get semua pengajian dengan filter
     * @param {Object} filters - { bulan (YYYY-MM), jenjang_id, wilayah_id }
     * @returns {Promise<Array>}
     */
    getAll: async function(filters = {}) {
        try {
            let query = db
                .from('v_pengajian_lengkap')
                .select('*')
                .order('tanggal', { ascending: false });
            
            if (filters.jenjang_id) {
                query = query.eq('jenjang_id', safeInt(filters.jenjang_id));
            }
            if (filters.wilayah_id) {
                query = query.eq('wilayah_id', safeInt(filters.wilayah_id));
            }
            if (filters.bulan) {
                // Handle both string (YYYY-MM) and Date object
                let year, month;
                if (typeof filters.bulan === 'string') {
                    [year, month] = filters.bulan.split('-');
                } else if (filters.bulan instanceof Date) {
                    year = filters.bulan.getFullYear();
                    month = String(filters.bulan.getMonth() + 1).padStart(2, '0');
                } else {
                    // Try to convert to string
                    const bulanStr = String(filters.bulan);
                    if (bulanStr.includes('-')) {
                        [year, month] = bulanStr.split('-');
                    }
                }
                if (year && month) {
                    const startDate = `${year}-${month}-01`;
                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                    const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
                    query = query.gte('tanggal', startDate).lte('tanggal', endDate);
                }
            }
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat data pengajian');
            return [];
        }
    },

    /**
     * Get pengajian by ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    getById: async function(id) {
        try {
            const { data, error } = await db
                .from('v_pengajian_lengkap')
                .select('*')
                .eq('id', safeInt(id))
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal memuat pengajian');
            return null;
        }
    },

    /**
     * Create pengajian baru
     * @param {Object} pengajianData
     * @returns {Promise<Object|null>}
     */
    create: async function(pengajianData) {
        try {
            const insertData = {
                wilayah_id: safeInt(pengajianData.wilayah_id),
                tanggal: pengajianData.tanggal,
                waktu_mulai: pengajianData.waktu_mulai || null,
                waktu_selesai: pengajianData.waktu_selesai || null,
                materi: pengajianData.materi || null,
                jenis_pengajian: pengajianData.jenis_pengajian || 'forum',
                created_by: currentUserData?.id || null
            };

            // Tambahkan jenjang_ids (array untuk multi-select)
            if (pengajianData.jenjang_ids) {
                insertData.jenjang_ids = pengajianData.jenjang_ids;
            }
            // Backward compatibility: jika jenjang_id tunggal dikirim
            if (pengajianData.jenjang_id) {
                insertData.jenjang_id = safeInt(pengajianData.jenjang_id);
            }
            // Tambahkan jenis_kelamin filter
            if (pengajianData.jenis_kelamin) {
                insertData.jenis_kelamin = pengajianData.jenis_kelamin;
            }
            // Tambahkan keterangan
            if (pengajianData.keterangan) {
                insertData.keterangan = pengajianData.keterangan;
            }

            console.log('Creating pengajian with data:', insertData);

            const { data, error } = await db
                .from('pengajian')
                .insert(insertData)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal membuat pengajian');
            return null;
        }
    },

    /**
     * Update pengajian
     * @param {number} id
     * @param {Object} pengajianData
     * @returns {Promise<boolean>}
     */
    update: async function(id, pengajianData) {
        try {
            const updateData = {
                wilayah_id: safeInt(pengajianData.wilayah_id),
                tanggal: pengajianData.tanggal,
                waktu_mulai: pengajianData.waktu_mulai || null,
                waktu_selesai: pengajianData.waktu_selesai || null,
                materi: pengajianData.materi || null
            };

            // Tambahkan jenjang_ids (array untuk multi-select)
            if (pengajianData.jenjang_ids !== undefined) {
                updateData.jenjang_ids = pengajianData.jenjang_ids;
            }
            // Backward compatibility: jika jenjang_id tunggal dikirim
            if (pengajianData.jenjang_id !== undefined) {
                updateData.jenjang_id = safeInt(pengajianData.jenjang_id);
            }
            // Tambahkan jenis_kelamin filter
            if (pengajianData.jenis_kelamin !== undefined) {
                updateData.jenis_kelamin = pengajianData.jenis_kelamin;
            }
            // Tambahkan keterangan
            if (pengajianData.keterangan !== undefined) {
                updateData.keterangan = pengajianData.keterangan;
            }

            console.log('Updating pengajian ID:', id, 'with data:', updateData);

            const { error } = await db
                .from('pengajian')
                .update(updateData)
                .eq('id', safeInt(id));

            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal mengupdate pengajian');
            return false;
        }
    },

    /**
     * Delete pengajian (beserta presensi)
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    delete: async function(id) {
        try {
            // Hapus presensi dulu
            await db.from('keaktifan_pengajian').delete().eq('pengajian_id', safeInt(id));
            // Hapus pengajian
            const { error } = await db.from('pengajian').delete().eq('id', safeInt(id));
            
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menghapus pengajian');
            return false;
        }
    },

    /**
     * Count pengajian
     * @param {Object} filters
     * @returns {Promise<number>}
     */
    count: async function(filters = {}) {
        try {
            let query = db.from('pengajian').select('*', { count: 'exact', head: true });
            
            if (filters.bulan) {
                // Handle both string (YYYY-MM) and Date object
                let year, month;
                if (typeof filters.bulan === 'string') {
                    [year, month] = filters.bulan.split('-');
                } else if (filters.bulan instanceof Date) {
                    year = filters.bulan.getFullYear();
                    month = String(filters.bulan.getMonth() + 1).padStart(2, '0');
                } else {
                    const bulanStr = String(filters.bulan);
                    if (bulanStr.includes('-')) {
                        [year, month] = bulanStr.split('-');
                    }
                }
                if (year && month) {
                    const startDate = `${year}-${month}-01`;
                    query = query.gte('tanggal', startDate);
                }
            }
            
            const { count, error } = await query;
            if (error) throw error;
            return count || 0;
        } catch (error) {
            handleApiError(error, 'Gagal menghitung pengajian');
            return 0;
        }
    }
};

// ============================================================================
// PRESENSI API
// ============================================================================

const presensiApi = {
    /**
     * Get presensi untuk pengajian tertentu
     * @param {number} pengajianId
     * @returns {Promise<Array>}
     */
    getByPengajian: async function(pengajianId) {
        try {
            const { data, error } = await db
                .from('keaktifan_pengajian')
                .select('*')
                .eq('pengajian_id', safeInt(pengajianId));
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat presensi');
            return [];
        }
    },

    /**
     * Get jamaah untuk input presensi (dari enrollment di wilayah pengajian)
     * @param {number} wilayahId
     * @returns {Promise<Array>}
     */
    getJamaahForPresensi: async function(wilayahId) {
        try {
            const { data, error } = await db
                .from('enrollment')
                .select('jamaah:jamaah_id(id, nama), jenjang:jenjang_id(nama)')
                .eq('wilayah_id', safeInt(wilayahId))
                .eq('status', 'aktif');
            
            if (error) throw error;
            
            // Flatten data
            return (data || []).map(e => ({
                id: e.jamaah?.id,
                nama: e.jamaah?.nama,
                jenjang: e.jenjang?.nama
            })).filter(j => j.id);
        } catch (error) {
            handleApiError(error, 'Gagal memuat jamaah');
            return [];
        }
    },

    /**
     * Simpan presensi (upsert)
     * @param {number} pengajianId
     * @param {Array} presensiData - [{ jamaah_id, status, keterangan }]
     * @returns {Promise<boolean>}
     */
    save: async function(pengajianId, presensiData) {
        try {
            // Hapus presensi lama
            await db.from('keaktifan_pengajian').delete().eq('pengajian_id', safeInt(pengajianId));
            
            // Insert presensi baru
            const insertData = presensiData.map(p => ({
                pengajian_id: safeInt(pengajianId),
                jamaah_id: safeInt(p.jamaah_id),
                status: p.status || 'hadir',
                keterangan: p.keterangan || null
            }));
            
            const { error } = await db.from('keaktifan_pengajian').insert(insertData);
            if (error) throw error;
            
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menyimpan presensi');
            return false;
        }
    },

    /**
     * Get rekap presensi jamaah
     * @param {number} jamaahId
     * @param {number} bulan
     * @param {number} tahun
     * @returns {Promise<Object>}
     */
    getRekapJamaah: async function(jamaahId, bulan = null, tahun = null) {
        try {
            // Coba gunakan function v2 dulu (tanpa enum), fallback ke v1
            var { data, error } = await db.rpc('get_presensi_rekap_v2', {
                p_jamaah_id: safeInt(jamaahId),
                p_bulan: safeInt(bulan),
                p_tahun: safeInt(tahun)
            });

            // Jika v2 tidak ada, coba v1
            if (error && error.code === '42883') {
                var result = await db.rpc('get_presensi_rekap', {
                    p_jamaah_id: safeInt(jamaahId),
                    p_bulan: safeInt(bulan),
                    p_tahun: safeInt(tahun)
                });
                data = result.data;
                error = result.error;
            }

            if (error) throw error;
            return data?.[0] || {
                total_pengajian: 0,
                total_hadir: 0,
                total_izin: 0,
                total_sakit: 0,
                total_alpa: 0,
                persentase_hadir: 0
            };
        } catch (error) {
            handleApiError(error, 'Gagal memuat rekap presensi');
            // Return default values instead of null to prevent rapor from breaking
            return {
                total_pengajian: 0,
                total_hadir: 0,
                total_izin: 0,
                total_sakit: 0,
                total_alpa: 0,
                persentase_hadir: 0
            };
        }
    }
};

// ============================================================================
// PROGRESS API
// ============================================================================

const progressApi = {
    /**
     * Get progress hafalan jamaah
     * @param {number} jamaahId
     * @returns {Promise<Array>}
     */
    getByJamaah: async function(jamaahId) {
        try {
            const { data, error } = await db
                .from('progress_jamaah')
                .select('materi_item_id, status, nilai, catatan, tanggal_mulai, tanggal_selesai')
                .eq('jamaah_id', safeInt(jamaahId));
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat progress');
            return [];
        }
    },

    /**
     * Get progress sebagai object { materi_item_id: progressData }
     * @param {number} jamaahId
     * @returns {Promise<Object>}
     */
    getByJamaahAsMap: async function(jamaahId) {
        const data = await this.getByJamaah(jamaahId);
        const map = {};
        data.forEach(p => {
            map[p.materi_item_id] = p;
        });
        return map;
    },

    /**
     * Get summary progress jamaah menggunakan stored procedure
     * @param {number} jamaahId
     * @returns {Promise<Array>}
     */
    getSummary: async function(jamaahId) {
        try {
            const { data, error } = await db.rpc('get_progress_summary', {
                p_jamaah_id: safeInt(jamaahId)
            });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat summary progress');
            return [];
        }
    },

    /**
     * Get progress summary per bidang sesuai target jenjang
     * @param {number} jamaahId
     * @param {number} jenjangId - jika ada akan filter target berdasarkan jenjang
     * @returns {Promise<Array>}
     */
    getSummaryByBidang: async function(jamaahId, jenjangId = null) {
        try {
            // Get target per kategori untuk jenjang ini
            let targetPerKategori = {};
            let kategoriIds = null;
            
            if (jenjangId) {
                const { data: targetData } = await db
                    .from('target_jenjang')
                    .select('kategori_id, target_jumlah')
                    .eq('jenjang_id', safeInt(jenjangId));
                
                if (targetData && targetData.length > 0) {
                    kategoriIds = [];
                    targetData.forEach(function(t) {
                        targetPerKategori[t.kategori_id] = t.target_jumlah;
                        kategoriIds.push(t.kategori_id);
                    });
                }
            }
            
            // Get kategori dengan bidang info
            let kategoriQuery = db
                .from('kategori_materi')
                .select('id, nama, bidang:bidang_id(id, nama)');
            
            if (kategoriIds && kategoriIds.length > 0) {
                kategoriQuery = kategoriQuery.in('id', kategoriIds);
            }
            
            const { data: kategoriData } = await kategoriQuery;
            
            // Group target per bidang
            const targetPerBidang = {};
            (kategoriData || []).forEach(function(k) {
                const bidangNama = k.bidang?.nama || 'Lainnya';
                const bidangId = k.bidang?.id || 0;
                
                if (!targetPerBidang[bidangNama]) {
                    targetPerBidang[bidangNama] = { id: bidangId, target: 0, kategoriIds: [] };
                }
                
                // Tambahkan target dari kategori ini
                const targetKat = targetPerKategori[k.id] || 0;
                targetPerBidang[bidangNama].target += targetKat;
                targetPerBidang[bidangNama].kategoriIds.push(k.id);
            });
            
            // Get progress jamaah
            const { data: progressData, error } = await db
                .from('progress_jamaah')
                .select(`
                    id, status, nilai,
                    materi_item:materi_item_id(
                        id, nama, kategori_id,
                        kategori:kategori_id(
                            id, nama,
                            bidang:bidang_id(id, nama)
                        )
                    )
                `)
                .eq('jamaah_id', safeInt(jamaahId));
            
            if (error) throw error;
            
            // Count progress per bidang (hanya untuk kategori target jika jenjang specified)
            const progressPerBidang = {};
            (progressData || []).forEach(function(p) {
                const kategoriId = p.materi_item?.kategori_id;
                
                // Skip jika bukan kategori target (ketika jenjang di-specify)
                if (kategoriIds && kategoriIds.indexOf(kategoriId) === -1) {
                    return;
                }
                
                const bidangNama = p.materi_item?.kategori?.bidang?.nama || 'Lainnya';
                if (!progressPerBidang[bidangNama]) {
                    progressPerBidang[bidangNama] = { selesai: 0, nilaiTotal: 0, nilaiCount: 0 };
                }
                if (p.status === 'selesai' || p.status === 'lulus') {
                    progressPerBidang[bidangNama].selesai++;
                }
                if (p.nilai) {
                    progressPerBidang[bidangNama].nilaiTotal += p.nilai;
                    progressPerBidang[bidangNama].nilaiCount++;
                }
            });
            
            // Combine into result
            const result = [];
            Object.keys(targetPerBidang).forEach(function(bidangNama) {
                const target = targetPerBidang[bidangNama];
                const prog = progressPerBidang[bidangNama] || { selesai: 0, nilaiTotal: 0, nilaiCount: 0 };
                
                result.push({
                    bidang_id: target.id,
                    bidang_nama: bidangNama,
                    total_materi: target.target, // Target dari target_jenjang
                    total_selesai: prog.selesai,
                    rata_nilai: prog.nilaiCount > 0 ? (prog.nilaiTotal / prog.nilaiCount).toFixed(1) : null
                });
            });
            
            return result;
        } catch (error) {
            handleApiError(error, 'Gagal memuat summary bidang');
            return [];
        }
    },

    /**
     * Get summary progress per kategori (detail per bidang)
     * @param {number} jamaahId
     * @param {number} jenjangId
     * @returns {Promise<Array>}
     */
    getSummaryByKategori: async function(jamaahId, jenjangId = null) {
        try {
            // Get target per kategori untuk jenjang ini
            var targetPerKategori = {};

            if (jenjangId) {
                var { data: targetData } = await db
                    .from('target_jenjang')
                    .select('kategori_id, target_jumlah')
                    .eq('jenjang_id', safeInt(jenjangId));

                if (targetData) {
                    targetData.forEach(function(t) {
                        targetPerKategori[t.kategori_id] = t.target_jumlah;
                    });
                }
            }

            // Get kategori dengan bidang info
            var { data: kategoriData } = await db
                .from('kategori_materi')
                .select('id, nama, bidang:bidang_id(id, nama)')
                .order('bidang_id')
                .order('nama');

            // Get progress jamaah
            var { data: progressData } = await db
                .from('progress_jamaah')
                .select('materi_item_id, status, nilai, materi_item:materi_item_id(kategori_id)')
                .eq('jamaah_id', safeInt(jamaahId));

            // Count progress per kategori
            var progressPerKategori = {};
            (progressData || []).forEach(function(p) {
                var kategoriId = p.materi_item?.kategori_id;
                if (!kategoriId) return;

                if (!progressPerKategori[kategoriId]) {
                    progressPerKategori[kategoriId] = { selesai: 0, nilaiTotal: 0, nilaiCount: 0 };
                }
                if (p.status === 'selesai' || p.status === 'lulus') {
                    progressPerKategori[kategoriId].selesai++;
                }
                if (p.nilai) {
                    progressPerKategori[kategoriId].nilaiTotal += p.nilai;
                    progressPerKategori[kategoriId].nilaiCount++;
                }
            });

            // Build result grouped by bidang
            var result = [];
            var currentBidang = null;

            (kategoriData || []).forEach(function(k) {
                var bidangNama = k.bidang?.nama || 'Lainnya';
                var bidangId = k.bidang?.id || 0;
                var target = targetPerKategori[k.id] || 0;
                var prog = progressPerKategori[k.id] || { selesai: 0, nilaiTotal: 0, nilaiCount: 0 };

                // Skip kategori tanpa target jika jenjang di-specify
                if (jenjangId && target === 0) return;

                result.push({
                    bidang_id: bidangId,
                    bidang_nama: bidangNama,
                    kategori_id: k.id,
                    kategori_nama: k.nama,
                    target: target,
                    selesai: prog.selesai,
                    rata_nilai: prog.nilaiCount > 0 ? (prog.nilaiTotal / prog.nilaiCount).toFixed(1) : null
                });
            });

            return result;
        } catch (error) {
            handleApiError(error, 'Gagal memuat summary kategori');
            return [];
        }
    },

    /**
     * Update atau create progress
     * @param {number} jamaahId
     * @param {number} materiItemId
     * @param {Object} progressData - { status, nilai, catatan }
     * @returns {Promise<boolean>}
     */
    upsert: async function(jamaahId, materiItemId, progressData) {
        try {
            const now = new Date();
            const payload = {
                jamaah_id: safeInt(jamaahId),
                materi_item_id: safeInt(materiItemId),
                status: progressData.status,
                nilai: progressData.nilai || null,
                catatan: progressData.catatan || null,
                periode_bulan: now.getMonth() + 1,
                periode_tahun: now.getFullYear(),
                updated_at: now.toISOString()
            };
            
            // Set tanggal
            if (progressData.status === 'sedang') {
                payload.tanggal_mulai = now.toISOString().split('T')[0];
            }
            if (progressData.status === 'selesai' || progressData.status === 'lulus') {
                payload.tanggal_selesai = now.toISOString().split('T')[0];
            }
            
            // Check existing
            const { data: existing } = await db
                .from('progress_jamaah')
                .select('id')
                .eq('jamaah_id', safeInt(jamaahId))
                .eq('materi_item_id', safeInt(materiItemId))
                .single();
            
            if (existing) {
                // Update
                const { error } = await db
                    .from('progress_jamaah')
                    .update(payload)
                    .eq('jamaah_id', safeInt(jamaahId))
                    .eq('materi_item_id', safeInt(materiItemId));
                if (error) throw error;
            } else {
                // Insert
                payload.tanggal_mulai = now.toISOString().split('T')[0];
                const { error } = await db.from('progress_jamaah').insert(payload);
                if (error) throw error;
            }
            
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menyimpan progress');
            return false;
        }
    }
};

// ============================================================================
// WILAYAH API
// ============================================================================

const wilayahApi = {
    /**
     * Get wilayah by ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    getById: async function(id) {
        try {
            const { data, error } = await db
                .from('wilayah')
                .select('*')
                .eq('id', safeInt(id))
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal memuat wilayah');
            return null;
        }
    },

    /**
     * Get semua wilayah
     * @param {Object} filters - { tingkat, is_aktif, parent_id }
     * @returns {Promise<Array>}
     */
    getAll: async function(filters = {}) {
        try {
            let query = db.from('wilayah').select('*');
            
            if (filters.tingkat) {
                query = query.eq('tingkat', filters.tingkat);
            }
            if (filters.is_aktif !== undefined) {
                query = query.eq('is_aktif', filters.is_aktif);
            }
            if (filters.parent_id) {
                query = query.eq('parent_id', safeInt(filters.parent_id));
            }
            
            query = query.order('nama');
            
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat wilayah');
            return [];
        }
    },

    /**
     * Get wilayah dengan hierarki
     * @returns {Promise<Array>}
     */
    getHierarki: async function() {
        try {
            const { data, error } = await db
                .from('v_wilayah_hierarki')
                .select('*')
                .order('nama');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat hierarki wilayah');
            return [];
        }
    },

    /**
     * Get wilayah by tingkat
     * @param {string} tingkat - 'daerah', 'desa', 'kelompok'
     * @returns {Promise<Array>}
     */
    getByTingkat: async function(tingkat) {
        return this.getAll({ tingkat, is_aktif: true });
    },

    /**
     * Get children wilayah
     * @param {number} parentId
     * @returns {Promise<Array>}
     */
    getChildren: async function(parentId) {
        return this.getAll({ parent_id: parentId, is_aktif: true });
    },

    /**
     * Get semua daerah
     * @returns {Promise<Array>}
     */
    getDaerah: async function() {
        return this.getByTingkat('daerah');
    },

    /**
     * Get semua desa
     * @param {number} daerahId - optional, filter by daerah
     * @returns {Promise<Array>}
     */
    getDesa: async function(daerahId) {
        if (daerahId) {
            return this.getAll({ tingkat: 'desa', parent_id: daerahId, is_aktif: true });
        }
        return this.getByTingkat('desa');
    },

    /**
     * Get semua kelompok
     * @param {number} desaId - optional, filter by desa
     * @returns {Promise<Array>}
     */
    getKelompok: async function(desaId) {
        if (desaId) {
            return this.getAll({ tingkat: 'kelompok', parent_id: desaId, is_aktif: true });
        }
        return this.getByTingkat('kelompok');
    },

    /**
     * Get wilayah by ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    getById: async function(id) {
        try {
            const { data, error } = await db
                .from('wilayah')
                .select('*')
                .eq('id', safeInt(id))
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal memuat wilayah');
            return null;
        }
    },

    /**
     * Create wilayah
     * @param {Object} wilayahData
     * @returns {Promise<Object|null>}
     */
    create: async function(wilayahData) {
        try {
            const { data, error } = await db
                .from('wilayah')
                .insert({
                    kode: wilayahData.kode,
                    nama: wilayahData.nama,
                    tingkat: wilayahData.tingkat,
                    parent_id: safeInt(wilayahData.parent_id),
                    is_aktif: wilayahData.is_aktif !== false
                })
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal membuat wilayah');
            return null;
        }
    },

    /**
     * Update wilayah
     * @param {number} id
     * @param {Object} wilayahData
     * @returns {Promise<boolean>}
     */
    update: async function(id, wilayahData) {
        try {
            const { error } = await db
                .from('wilayah')
                .update({
                    kode: wilayahData.kode,
                    nama: wilayahData.nama,
                    tingkat: wilayahData.tingkat,
                    parent_id: safeInt(wilayahData.parent_id),
                    is_aktif: wilayahData.is_aktif
                })
                .eq('id', safeInt(id));
            
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal mengupdate wilayah');
            return false;
        }
    },

    /**
     * Delete wilayah
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    delete: async function(id) {
        try {
            const { error } = await db.from('wilayah').delete().eq('id', safeInt(id));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menghapus wilayah');
            return false;
        }
    },

    /**
     * Count wilayah
     * @param {Object} filters
     * @returns {Promise<number>}
     */
    count: async function(filters = {}) {
        try {
            let query = db.from('wilayah').select('*', { count: 'exact', head: true });
            
            if (filters.tingkat) {
                query = query.eq('tingkat', filters.tingkat);
            }
            if (filters.is_aktif !== undefined) {
                query = query.eq('is_aktif', filters.is_aktif);
            }
            
            const { count, error } = await query;
            if (error) throw error;
            return count || 0;
        } catch (error) {
            handleApiError(error, 'Gagal menghitung wilayah');
            return 0;
        }
    }
};

// ============================================================================
// MASTER DATA API
// ============================================================================

const masterApi = {
    /**
     * Get semua jenjang
     * @returns {Promise<Array>}
     */
    getJenjang: async function() {
        try {
            const { data, error } = await db
                .from('jenjang')
                .select('*')
                .eq('is_aktif', true)
                .order('urutan');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat jenjang');
            return [];
        }
    },

    /**
     * Get semua bidang
     * @returns {Promise<Array>}
     */
    getBidang: async function() {
        try {
            const { data, error } = await db
                .from('bidang')
                .select('*')
                .order('urutan');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat bidang');
            return [];
        }
    },

    /**
     * Get semua kategori materi
     * @param {number} bidangId (optional)
     * @returns {Promise<Array>}
     */
    getKategori: async function(bidangId = null) {
        try {
            let query = db
                .from('kategori_materi')
                .select('*, bidang:bidang_id(nama)')
                .eq('is_aktif', true)
                .order('urutan');
            
            if (bidangId) {
                query = query.eq('bidang_id', safeInt(bidangId));
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat kategori');
            return [];
        }
    },

    /**
     * Get materi item
     * @param {Object} filters - { kategori_id, tipe }
     * @returns {Promise<Array>}
     */
    getMateri: async function(filters = {}) {
        try {
            let query = db.from('materi_item').select('*, kategori:kategori_materi(id, kode, nama)');

            if (filters.kategori_id) {
                query = query.eq('kategori_id', safeInt(filters.kategori_id));
            }
            if (filters.tipe) {
                query = query.eq('tipe', filters.tipe);
            }

            query = query.order('nomor');

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat materi');
            return [];
        }
    },

    /**
     * Get materi dengan kategori dan bidang (dari view)
     * @returns {Promise<Array>}
     */
    getMateriLengkap: async function() {
        try {
            const { data, error } = await db
                .from('v_materi_kurikulum')
                .select('*');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat materi');
            return [];
        }
    },

    /**
     * Get tahun ajaran
     * @param {boolean} aktifOnly
     * @returns {Promise<Array>}
     */
    getTahunAjaran: async function(aktifOnly = false) {
        try {
            let query = db.from('tahun_ajaran').select('*').order('kode', { ascending: false });
            
            if (aktifOnly) {
                query = query.eq('is_aktif', true);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat tahun ajaran');
            return [];
        }
    },

    /**
     * Get tahun ajaran aktif
     * @returns {Promise<Object|null>}
     */
    getTahunAjaranAktif: async function() {
        try {
            const { data, error } = await db
                .from('tahun_ajaran')
                .select('*')
                .eq('is_aktif', true)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        } catch (error) {
            handleApiError(error, 'Gagal memuat tahun ajaran aktif');
            return null;
        }
    },

    /**
     * Get semua role
     * @returns {Promise<Array>}
     */
    getRole: async function() {
        try {
            const { data, error } = await db
                .from('role')
                .select('*')
                .order('level');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat role');
            return [];
        }
    },

    /**
     * Get status jamaah
     * @returns {Promise<Array>}
     */
    getStatusJamaah: async function() {
        try {
            const { data, error } = await db
                .from('status_jamaah')
                .select('*')
                .eq('is_aktif', true)
                .order('urutan');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat status jamaah');
            return [];
        }
    }
};

// ============================================================================
// USER API
// ============================================================================

const userApi = {
    /**
     * Get semua users
     * @returns {Promise<Array>}
     */
    getAll: async function() {
        try {
            const { data, error } = await db
                .from('users')
                .select('*')
                .order('nama');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat users');
            return [];
        }
    },

    /**
     * Get user dengan role (dari view)
     * @returns {Promise<Array>}
     */
    getAllWithRoles: async function() {
        try {
            const { data, error } = await db
                .from('v_user_role_lengkap')
                .select('*')
                .eq('is_aktif', true);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat user roles');
            return [];
        }
    },

    /**
     * Update user
     * @param {number} id
     * @param {Object} userData
     * @returns {Promise<boolean>}
     */
    update: async function(id, userData) {
        try {
            const { error } = await db
                .from('users')
                .update({
                    nama: userData.nama,
                    phone: userData.phone,
                    alamat: userData.alamat,
                    updated_at: new Date().toISOString()
                })
                .eq('id', safeInt(id));
            
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal mengupdate user');
            return false;
        }
    },

    /**
     * Assign role ke user
     * @param {number} userId
     * @param {number} roleId
     * @param {number} wilayahId (optional)
     * @returns {Promise<boolean>}
     */
    assignRole: async function(userId, roleId, wilayahId = null) {
        try {
            const { error } = await db.from('user_role').insert({
                user_id: safeInt(userId),
                role_id: safeInt(roleId),
                wilayah_id: safeInt(wilayahId),
                is_aktif: true
            });
            
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal assign role');
            return false;
        }
    },

    /**
     * Remove role dari user
     * @param {number} userRoleId
     * @returns {Promise<boolean>}
     */
    removeRole: async function(userRoleId) {
        try {
            const { error } = await db
                .from('user_role')
                .delete()
                .eq('id', safeInt(userRoleId));
            
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menghapus role');
            return false;
        }
    },

    /**
     * Toggle status role
     * @param {number} userRoleId
     * @param {boolean} isAktif
     * @returns {Promise<boolean>}
     */
    toggleRoleStatus: async function(userRoleId, isAktif) {
        try {
            const { error } = await db
                .from('user_role')
                .update({ is_aktif: isAktif })
                .eq('id', safeInt(userRoleId));
            
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal mengubah status role');
            return false;
        }
    }
};

// ============================================================================
// DASHBOARD API
// ============================================================================

const dashboardApi = {
    /**
     * Get statistik dashboard
     * @returns {Promise<Object>}
     */
    getStats: async function() {
        try {
            const { data, error } = await db
                .from('v_dashboard_stats')
                .select('*')
                .single();
            
            if (error) throw error;
            return data || {
                total_jamaah_aktif: 0,
                total_generus: 0,
                total_kelompok: 0,
                total_desa: 0,
                total_materi: 0,
                pengajian_bulan_ini: 0
            };
        } catch (error) {
            handleApiError(error, 'Gagal memuat statistik');
            return null;
        }
    },

    /**
     * Get statistik per jenjang
     * @returns {Promise<Array>}
     */
    getStatistikJenjang: async function() {
        try {
            const { data, error } = await db
                .from('v_statistik_jenjang')
                .select('*')
                .order('urutan');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat statistik jenjang');
            return [];
        }
    },

    /**
     * Get pengajian terbaru
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    getRecentPengajian: async function(limit = 5) {
        return pengajianApi.getAll({ limit });
    },

    /**
     * Get progress terbaru
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    getRecentProgress: async function(limit = 5) {
        try {
            const { data, error } = await db
                .from('progress_jamaah')
                .select('*, jamaah:jamaah_id(nama), materi_item:materi_item_id(nama)')
                .eq('status', 'selesai')
                .order('tanggal_selesai', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat progress terbaru');
            return [];
        }
    }
};

// ============================================================================
// PERNIKAHAN API
// ============================================================================

const pernikahanApi = {
    /**
     * Proses pernikahan menggunakan stored procedure
     * @param {number} jamaahId
     * @param {number} pasanganId (optional)
     * @param {string} tanggalMenikah
     * @returns {Promise<boolean>}
     */
    proses: async function(jamaahId, pasanganId = null, tanggalMenikah = null) {
        try {
            const { data, error } = await db.rpc('sp_proses_pernikahan', {
                p_jamaah_id: safeInt(jamaahId),
                p_pasangan_id: safeInt(pasanganId),
                p_tanggal_menikah: tanggalMenikah || new Date().toISOString().split('T')[0],
                p_updated_by: currentUserData?.id || null
            });
            
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal memproses pernikahan');
            return false;
        }
    }
};

// ============================================================================
// JADWAL RUTIN API
// ============================================================================

const jadwalRutinApi = {
    /**
     * Get semua jadwal rutin dengan filter
     * @param {Object} filters - { wilayah_id, jenjang_id, tingkat, is_aktif }
     * @returns {Promise<Array>}
     */
    getAll: async function(filters = {}) {
        try {
            var query = db.from('v_jadwal_rutin_lengkap').select('*');
            
            if (filters.wilayah_id) {
                query = query.eq('wilayah_id', safeInt(filters.wilayah_id));
            }
            if (filters.jenjang_id) {
                query = query.eq('jenjang_id', safeInt(filters.jenjang_id));
            }
            if (filters.tingkat) {
                query = query.eq('tingkat', filters.tingkat);
            }
            if (filters.is_aktif !== undefined) {
                query = query.eq('is_aktif', filters.is_aktif);
            }
            
            query = query.order('nama');
            
            var result = await query;
            if (result.error) throw result.error;
            return result.data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat jadwal rutin');
            return [];
        }
    },
    
    /**
     * Get jadwal rutin by ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    getById: async function(id) {
        try {
            var result = await db
                .from('v_jadwal_rutin_lengkap')
                .select('*')
                .eq('id', safeInt(id))
                .single();
            
            if (result.error) throw result.error;
            return result.data;
        } catch (error) {
            handleApiError(error, 'Gagal memuat jadwal rutin');
            return null;
        }
    },
    
    /**
     * Create jadwal rutin baru
     * @param {Object} data
     * @returns {Promise<number|null>}
     */
    create: async function(data) {
        try {
            var insertData = {
                nama: data.nama,
                tingkat: data.tingkat,
                wilayah_id: safeInt(data.wilayah_id),
                jenjang_id: safeInt(data.jenjang_id),
                tipe: data.tipe,
                waktu_mulai: data.waktu_mulai || null,
                waktu_selesai: data.waktu_selesai || null,
                materi_default: data.materi_default || null,
                is_aktif: data.is_aktif !== false,
                created_by: currentUserData?.id || null
            };

            // Support multi-jenjang
            if (data.jenjang_ids && Array.isArray(data.jenjang_ids) && data.jenjang_ids.length > 0) {
                insertData.jenjang_ids = data.jenjang_ids;
            }

            console.log('jadwalRutinApi.create - insertData:', insertData);

            // Setting HARIAN
            if (data.tipe === 'harian') {
                insertData.hari_minggu = data.hari_minggu || false;
                insertData.hari_senin = data.hari_senin || false;
                insertData.hari_selasa = data.hari_selasa || false;
                insertData.hari_rabu = data.hari_rabu || false;
                insertData.hari_kamis = data.hari_kamis || false;
                insertData.hari_jumat = data.hari_jumat || false;
                insertData.hari_sabtu = data.hari_sabtu || false;
            }
            
            // Setting MINGGUAN
            if (data.tipe === 'mingguan') {
                insertData.minggu_ke = safeInt(data.minggu_ke);
                insertData.hari_dalam_minggu = safeInt(data.hari_dalam_minggu);
            }
            
            // Setting BULANAN
            if (data.tipe === 'bulanan') {
                insertData.bulan_jan = data.bulan_jan || false;
                insertData.bulan_feb = data.bulan_feb || false;
                insertData.bulan_mar = data.bulan_mar || false;
                insertData.bulan_apr = data.bulan_apr || false;
                insertData.bulan_mei = data.bulan_mei || false;
                insertData.bulan_jun = data.bulan_jun || false;
                insertData.bulan_jul = data.bulan_jul || false;
                insertData.bulan_agt = data.bulan_agt || false;
                insertData.bulan_sep = data.bulan_sep || false;
                insertData.bulan_okt = data.bulan_okt || false;
                insertData.bulan_nov = data.bulan_nov || false;
                insertData.bulan_des = data.bulan_des || false;
                insertData.minggu_ke_bulanan = safeInt(data.minggu_ke_bulanan);
                insertData.hari_dalam_minggu_bulanan = safeInt(data.hari_dalam_minggu_bulanan);
            }
            
            var result = await db
                .from('jadwal_rutin')
                .insert(insertData)
                .select('id')
                .single();
            
            if (result.error) throw result.error;
            return result.data?.id || null;
        } catch (error) {
            handleApiError(error, 'Gagal membuat jadwal rutin');
            return null;
        }
    },
    
    /**
     * Update jadwal rutin
     * @param {number} id
     * @param {Object} data
     * @returns {Promise<boolean>}
     */
    update: async function(id, data) {
        try {
            var updateData = {
                nama: data.nama,
                tingkat: data.tingkat,
                wilayah_id: safeInt(data.wilayah_id),
                jenjang_id: safeInt(data.jenjang_id),
                tipe: data.tipe,
                waktu_mulai: data.waktu_mulai || null,
                waktu_selesai: data.waktu_selesai || null,
                materi_default: data.materi_default || null,
                is_aktif: data.is_aktif !== false,
                updated_at: new Date().toISOString()
            };

            // Support multi-jenjang
            if (data.jenjang_ids && Array.isArray(data.jenjang_ids) && data.jenjang_ids.length > 0) {
                updateData.jenjang_ids = data.jenjang_ids;
            } else {
                updateData.jenjang_ids = null;
            }

            console.log('jadwalRutinApi.update - updateData:', updateData);

            // Reset semua setting
            updateData.hari_minggu = false;
            updateData.hari_senin = false;
            updateData.hari_selasa = false;
            updateData.hari_rabu = false;
            updateData.hari_kamis = false;
            updateData.hari_jumat = false;
            updateData.hari_sabtu = false;
            updateData.minggu_ke = null;
            updateData.hari_dalam_minggu = null;
            updateData.bulan_jan = false;
            updateData.bulan_feb = false;
            updateData.bulan_mar = false;
            updateData.bulan_apr = false;
            updateData.bulan_mei = false;
            updateData.bulan_jun = false;
            updateData.bulan_jul = false;
            updateData.bulan_agt = false;
            updateData.bulan_sep = false;
            updateData.bulan_okt = false;
            updateData.bulan_nov = false;
            updateData.bulan_des = false;
            updateData.minggu_ke_bulanan = null;
            updateData.hari_dalam_minggu_bulanan = null;
            
            // Setting sesuai tipe
            if (data.tipe === 'harian') {
                updateData.hari_minggu = data.hari_minggu || false;
                updateData.hari_senin = data.hari_senin || false;
                updateData.hari_selasa = data.hari_selasa || false;
                updateData.hari_rabu = data.hari_rabu || false;
                updateData.hari_kamis = data.hari_kamis || false;
                updateData.hari_jumat = data.hari_jumat || false;
                updateData.hari_sabtu = data.hari_sabtu || false;
            } else if (data.tipe === 'mingguan') {
                updateData.minggu_ke = safeInt(data.minggu_ke);
                updateData.hari_dalam_minggu = safeInt(data.hari_dalam_minggu);
            } else if (data.tipe === 'bulanan') {
                updateData.bulan_jan = data.bulan_jan || false;
                updateData.bulan_feb = data.bulan_feb || false;
                updateData.bulan_mar = data.bulan_mar || false;
                updateData.bulan_apr = data.bulan_apr || false;
                updateData.bulan_mei = data.bulan_mei || false;
                updateData.bulan_jun = data.bulan_jun || false;
                updateData.bulan_jul = data.bulan_jul || false;
                updateData.bulan_agt = data.bulan_agt || false;
                updateData.bulan_sep = data.bulan_sep || false;
                updateData.bulan_okt = data.bulan_okt || false;
                updateData.bulan_nov = data.bulan_nov || false;
                updateData.bulan_des = data.bulan_des || false;
                updateData.minggu_ke_bulanan = safeInt(data.minggu_ke_bulanan);
                updateData.hari_dalam_minggu_bulanan = safeInt(data.hari_dalam_minggu_bulanan);
            }
            
            var result = await db
                .from('jadwal_rutin')
                .update(updateData)
                .eq('id', safeInt(id));
            
            if (result.error) throw result.error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal mengupdate jadwal rutin');
            return false;
        }
    },
    
    /**
     * Delete jadwal rutin
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    delete: async function(id) {
        try {
            var result = await db
                .from('jadwal_rutin')
                .delete()
                .eq('id', safeInt(id));
            
            if (result.error) throw result.error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menghapus jadwal rutin');
            return false;
        }
    },
    
    /**
     * Toggle status aktif
     * @param {number} id
     * @param {boolean} isAktif
     * @returns {Promise<boolean>}
     */
    toggleAktif: async function(id, isAktif) {
        try {
            var result = await db
                .from('jadwal_rutin')
                .update({ is_aktif: isAktif })
                .eq('id', safeInt(id));
            
            if (result.error) throw result.error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal mengubah status');
            return false;
        }
    },
    
    /**
     * Preview tanggal yang akan di-generate
     * @param {number} jadwalRutinId
     * @param {number} tahun
     * @param {number} bulan
     * @returns {Promise<Array>}
     */
    previewTanggal: async function(jadwalRutinId, tahun, bulan) {
        try {
            var result = await db.rpc('generate_tanggal_jadwal', {
                p_jadwal_rutin_id: safeInt(jadwalRutinId),
                p_tahun: tahun,
                p_bulan: bulan
            });
            
            if (result.error) throw result.error;
            return result.data || [];
        } catch (error) {
            handleApiError(error, 'Gagal preview tanggal');
            return [];
        }
    },
    
    /**
     * Generate pengajian untuk bulan tertentu
     * @param {number} tahun
     * @param {number} bulan
     * @returns {Promise<Array>}
     */
    generateBulanan: async function(tahun, bulan) {
        try {
            var result = await db.rpc('sp_generate_pengajian_bulanan', {
                p_tahun: tahun,
                p_bulan: bulan,
                p_created_by: currentUserData?.id || null
            });
            
            if (result.error) throw result.error;
            return result.data || [];
        } catch (error) {
            handleApiError(error, 'Gagal generate jadwal');
            return [];
        }
    }
};

// ============================================================================
// TANGGAL SKIP (LIBUR) API
// ============================================================================

const tanggalSkipApi = {
    /**
     * Get semua tanggal skip
     * @param {number} tahun - filter tahun (optional)
     * @returns {Promise<Array>}
     */
    getAll: async function(tahun) {
        try {
            var query = db.from('tanggal_skip').select('*').eq('is_aktif', true);
            
            if (tahun) {
                var startDate = tahun + '-01-01';
                var endDate = tahun + '-12-31';
                query = query.gte('tanggal', startDate).lte('tanggal', endDate);
            }
            
            query = query.order('tanggal');
            
            var result = await query;
            if (result.error) throw result.error;
            return result.data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat tanggal libur');
            return [];
        }
    },
    
    /**
     * Tambah tanggal skip
     * @param {string} tanggal
     * @param {string} keterangan
     * @returns {Promise<boolean>}
     */
    add: async function(tanggal, keterangan) {
        try {
            var result = await db
                .from('tanggal_skip')
                .insert({ tanggal: tanggal, keterangan: keterangan || null })
                .select();
            
            if (result.error) throw result.error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menambah tanggal libur');
            return false;
        }
    },
    
    /**
     * Hapus tanggal skip
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    delete: async function(id) {
        try {
            var result = await db
                .from('tanggal_skip')
                .delete()
                .eq('id', safeInt(id));
            
            if (result.error) throw result.error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menghapus tanggal libur');
            return false;
        }
    }
};

// ============================================================================
// JENJANG API (Wrapper untuk masterApi.getJenjang)
// ============================================================================

const jenjangApi = {
    /**
     * Get semua jenjang aktif
     * @returns {Promise<Array>}
     */
    getAll: async function() {
        return await masterApi.getJenjang();
    },
    
    /**
     * Get jenjang by ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    getById: async function(id) {
        try {
            const { data, error } = await db
                .from('jenjang')
                .select('*')
                .eq('id', safeInt(id))
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal memuat jenjang');
            return null;
        }
    }
};

// ============================================================================
// EXPORT - Make APIs available globally
// ============================================================================

window.jamaahApi = jamaahApi;
window.generusApi = generusApi;
window.enrollmentApi = enrollmentApi;
window.pengajianApi = pengajianApi;
window.presensiApi = presensiApi;
window.progressApi = progressApi;
window.wilayahApi = wilayahApi;
window.masterApi = masterApi;
window.userApi = userApi;
window.dashboardApi = dashboardApi;
window.pernikahanApi = pernikahanApi;
window.jadwalRutinApi = jadwalRutinApi;
window.tanggalSkipApi = tanggalSkipApi;
window.jenjangApi = jenjangApi;

// ============================================================================
// ROLE PERMISSION API
// ============================================================================

const rolePermissionApi = {
    /**
     * Get semua resource
     * @returns {Promise<Array>}
     */
    getResources: async function() {
        try {
            const { data, error } = await db
                .from('resource')
                .select('*')
                .eq('is_aktif', true)
                .order('urutan');

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat resource');
            return [];
        }
    },

    /**
     * Get semua permission dengan role dan resource info
     * @returns {Promise<Array>}
     */
    getAllPermissions: async function() {
        try {
            const { data, error } = await db
                .from('v_role_permission')
                .select('*');

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat permission');
            return [];
        }
    },

    /**
     * Get permission by role
     * @param {number} roleId
     * @returns {Promise<Array>}
     */
    getByRole: async function(roleId) {
        try {
            const { data, error } = await db
                .from('v_role_permission')
                .select('*')
                .eq('role_id', safeInt(roleId));

            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat permission role');
            return [];
        }
    },

    /**
     * Get permission matrix (role x resource)
     * @returns {Promise<Object>} { roles: [], resources: [], matrix: {} }
     */
    getMatrix: async function() {
        try {
            // Get all roles
            const { data: roles } = await db
                .from('role')
                .select('*')
                .order('level');

            // Get all resources
            const { data: resources } = await db
                .from('resource')
                .select('*')
                .eq('is_aktif', true)
                .order('urutan');

            // Get all permissions
            const { data: permissions } = await db
                .from('role_permission')
                .select('*');

            // Build matrix
            const matrix = {};
            (permissions || []).forEach(p => {
                const key = `${p.role_id}_${p.resource_id}`;
                matrix[key] = {
                    can_view: p.can_view,
                    can_create: p.can_create,
                    can_edit: p.can_edit,
                    can_delete: p.can_delete
                };
            });

            return {
                roles: roles || [],
                resources: resources || [],
                matrix: matrix
            };
        } catch (error) {
            handleApiError(error, 'Gagal memuat matrix permission');
            return { roles: [], resources: [], matrix: {} };
        }
    },

    /**
     * Update atau create permission
     * @param {number} roleId
     * @param {number} resourceId
     * @param {Object} permissions - { can_view, can_create, can_edit, can_delete }
     * @returns {Promise<boolean>}
     */
    upsert: async function(roleId, resourceId, permissions) {
        try {
            const payload = {
                role_id: safeInt(roleId),
                resource_id: safeInt(resourceId),
                can_view: permissions.can_view || false,
                can_create: permissions.can_create || false,
                can_edit: permissions.can_edit || false,
                can_delete: permissions.can_delete || false,
                updated_at: new Date().toISOString()
            };

            const { error } = await db
                .from('role_permission')
                .upsert(payload, { onConflict: 'role_id,resource_id' });

            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menyimpan permission');
            return false;
        }
    },

    /**
     * Bulk update permissions untuk satu role
     * @param {number} roleId
     * @param {Array} permissions - [{ resource_id, can_view, can_create, can_edit, can_delete }]
     * @returns {Promise<boolean>}
     */
    bulkUpdate: async function(roleId, permissions) {
        try {
            const payloads = permissions.map(p => ({
                role_id: safeInt(roleId),
                resource_id: safeInt(p.resource_id),
                can_view: p.can_view || false,
                can_create: p.can_create || false,
                can_edit: p.can_edit || false,
                can_delete: p.can_delete || false,
                updated_at: new Date().toISOString()
            }));

            const { error } = await db
                .from('role_permission')
                .upsert(payloads, { onConflict: 'role_id,resource_id' });

            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menyimpan permissions');
            return false;
        }
    },

    /**
     * Delete permission
     * @param {number} roleId
     * @param {number} resourceId
     * @returns {Promise<boolean>}
     */
    delete: async function(roleId, resourceId) {
        try {
            const { error } = await db
                .from('role_permission')
                .delete()
                .eq('role_id', safeInt(roleId))
                .eq('resource_id', safeInt(resourceId));

            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal menghapus permission');
            return false;
        }
    },

    /**
     * Get user permissions berdasarkan semua role-nya
     * @param {number} userId
     * @returns {Promise<Object>} { resource_kode: { can_view, can_create, can_edit, can_delete } }
     */
    getUserPermissions: async function(userId) {
        try {
            const { data, error } = await db.rpc('get_user_permissions', {
                p_user_id: safeInt(userId)
            });

            if (error) throw error;

            // Convert to object map
            const permMap = {};
            (data || []).forEach(p => {
                permMap[p.resource_kode] = {
                    can_view: p.can_view,
                    can_create: p.can_create,
                    can_edit: p.can_edit,
                    can_delete: p.can_delete
                };
            });

            return permMap;
        } catch (error) {
            handleApiError(error, 'Gagal memuat user permissions');
            return {};
        }
    },

    /**
     * Reset permission role ke default
     * @param {number} roleId
     * @returns {Promise<boolean>}
     */
    resetToDefault: async function(roleId) {
        try {
            // Hapus semua permission untuk role ini
            await db.from('role_permission').delete().eq('role_id', safeInt(roleId));

            showToast('Permission role telah direset', 'info');
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal reset permission');
            return false;
        }
    },

    /**
     * Copy permission dari role lain
     * @param {number} sourceRoleId
     * @param {number} targetRoleId
     * @returns {Promise<boolean>}
     */
    copyFromRole: async function(sourceRoleId, targetRoleId) {
        try {
            // Get source permissions
            const { data: sourcePerms } = await db
                .from('role_permission')
                .select('*')
                .eq('role_id', safeInt(sourceRoleId));

            if (!sourcePerms || sourcePerms.length === 0) {
                showToast('Role sumber tidak memiliki permission', 'warning');
                return false;
            }

            // Prepare target payloads
            const payloads = sourcePerms.map(p => ({
                role_id: safeInt(targetRoleId),
                resource_id: p.resource_id,
                can_view: p.can_view,
                can_create: p.can_create,
                can_edit: p.can_edit,
                can_delete: p.can_delete,
                updated_at: new Date().toISOString()
            }));

            // Upsert to target role
            const { error } = await db
                .from('role_permission')
                .upsert(payloads, { onConflict: 'role_id,resource_id' });

            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal copy permission');
            return false;
        }
    }
};

window.rolePermissionApi = rolePermissionApi;

// ============================================================================
// KELAS PENGAJIAN API
// ============================================================================

const kelasPengajianApi = {
    getAll: async function(filters = {}) {
        try {
            var query = db.from('kelas_pengajian')
                .select('*, wilayah:wilayah_id(nama), tahun_ajaran:tahun_ajaran_id(nama), muballigh:muballigh_id(nama), pendamping:pendamping_id(nama)');

            if (filters.wilayah_id) query = query.eq('wilayah_id', safeInt(filters.wilayah_id));
            if (filters.tahun_ajaran_id) query = query.eq('tahun_ajaran_id', safeInt(filters.tahun_ajaran_id));
            if (filters.is_aktif !== undefined) query = query.eq('is_aktif', filters.is_aktif);

            query = query.order('nama');

            var { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat kelas');
            return [];
        }
    },

    getById: async function(id) {
        try {
            var { data, error } = await db.from('kelas_pengajian')
                .select('*, wilayah:wilayah_id(nama), tahun_ajaran:tahun_ajaran_id(nama)')
                .eq('id', safeInt(id))
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal memuat kelas');
            return null;
        }
    },

    create: async function(data) {
        try {
            var { data: result, error } = await db.from('kelas_pengajian')
                .insert(data)
                .select('id')
                .single();
            if (error) throw error;
            return result?.id || null;
        } catch (error) {
            handleApiError(error, 'Gagal membuat kelas');
            return null;
        }
    },

    update: async function(id, data) {
        try {
            var { error } = await db.from('kelas_pengajian').update(data).eq('id', safeInt(id));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal update kelas');
            return false;
        }
    },

    delete: async function(id) {
        try {
            await db.from('anggota_kelas').delete().eq('kelas_id', safeInt(id));
            await db.from('kelas_tingkat').delete().eq('kelas_id', safeInt(id));
            var { error } = await db.from('kelas_pengajian').delete().eq('id', safeInt(id));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal hapus kelas');
            return false;
        }
    },

    getAnggota: async function(kelasId) {
        try {
            var { data, error } = await db.from('anggota_kelas')
                .select('*, jamaah:jamaah_id(id, nama, jenis_kelamin)')
                .eq('kelas_id', safeInt(kelasId))
                .eq('status', 'aktif');
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat anggota');
            return [];
        }
    },

    addAnggota: async function(kelasId, jamaahId) {
        try {
            var { error } = await db.from('anggota_kelas').insert({
                kelas_id: safeInt(kelasId),
                jamaah_id: safeInt(jamaahId),
                status: 'aktif',
                tanggal_bergabung: new Date().toISOString().split('T')[0]
            });
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal tambah anggota');
            return false;
        }
    },

    removeAnggota: async function(anggotaId) {
        try {
            var { error } = await db.from('anggota_kelas')
                .update({ status: 'keluar', tanggal_keluar: new Date().toISOString().split('T')[0] })
                .eq('id', safeInt(anggotaId));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal keluarkan anggota');
            return false;
        }
    }
};

window.kelasPengajianApi = kelasPengajianApi;

// ============================================================================
// PENILAIAN AKHLAQ API
// ============================================================================

const penilaianAkhlaqApi = {
    getAll: async function(filters = {}) {
        try {
            var query = db.from('penilaian_akhlaq')
                .select('*, jamaah:jamaah_id(nama, jenis_kelamin)');

            if (filters.jamaah_id) query = query.eq('jamaah_id', safeInt(filters.jamaah_id));
            if (filters.periode_bulan) query = query.eq('periode_bulan', safeInt(filters.periode_bulan));
            if (filters.periode_tahun) query = query.eq('periode_tahun', safeInt(filters.periode_tahun));

            var { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat penilaian');
            return [];
        }
    },

    getByJamaah: async function(jamaahId, bulan, tahun) {
        try {
            var { data, error } = await db.from('penilaian_akhlaq')
                .select('*')
                .eq('jamaah_id', safeInt(jamaahId))
                .eq('periode_bulan', safeInt(bulan))
                .eq('periode_tahun', safeInt(tahun))
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        } catch (error) {
            handleApiError(error, 'Gagal memuat penilaian');
            return null;
        }
    },

    save: async function(data) {
        try {
            var { error } = await db.from('penilaian_akhlaq')
                .upsert(data, { onConflict: 'jamaah_id,periode_bulan,periode_tahun' });
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal simpan penilaian');
            return false;
        }
    }
};

window.penilaianAkhlaqApi = penilaianAkhlaqApi;

// ============================================================================
// MUSYAWARAH API
// ============================================================================

const musyawarahApi = {
    getAll: async function(filters = {}) {
        try {
            var query = db.from('musyawarah')
                .select('*, wilayah:wilayah_id(nama, tingkat)')
                .order('tanggal', { ascending: false });

            if (filters.wilayah_id) query = query.eq('wilayah_id', safeInt(filters.wilayah_id));
            if (filters.jenis) query = query.eq('jenis', filters.jenis);

            var { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat musyawarah');
            return [];
        }
    },

    getById: async function(id) {
        try {
            var { data, error } = await db.from('musyawarah')
                .select('*, wilayah:wilayah_id(nama)')
                .eq('id', safeInt(id))
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal memuat musyawarah');
            return null;
        }
    },

    create: async function(data) {
        try {
            var { data: result, error } = await db.from('musyawarah')
                .insert(data)
                .select('id')
                .single();
            if (error) throw error;
            return result?.id || null;
        } catch (error) {
            handleApiError(error, 'Gagal membuat musyawarah');
            return null;
        }
    },

    update: async function(id, data) {
        try {
            var { error } = await db.from('musyawarah').update(data).eq('id', safeInt(id));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal update musyawarah');
            return false;
        }
    },

    delete: async function(id) {
        try {
            await db.from('musyawarah_hasil').delete().eq('musyawarah_id', safeInt(id));
            await db.from('musyawarah_peserta').delete().eq('musyawarah_id', safeInt(id));
            var { error } = await db.from('musyawarah').delete().eq('id', safeInt(id));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal hapus musyawarah');
            return false;
        }
    },

    getHasil: async function(musyawarahId) {
        try {
            var { data, error } = await db.from('musyawarah_hasil')
                .select('*')
                .eq('musyawarah_id', safeInt(musyawarahId))
                .order('urutan');
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat hasil');
            return [];
        }
    },

    saveHasil: async function(musyawarahId, hasilList) {
        try {
            await db.from('musyawarah_hasil').delete().eq('musyawarah_id', safeInt(musyawarahId));
            if (hasilList.length > 0) {
                var { error } = await db.from('musyawarah_hasil').insert(hasilList);
                if (error) throw error;
            }
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal simpan hasil');
            return false;
        }
    }
};

window.musyawarahApi = musyawarahApi;

// ============================================================================
// KEGIATAN API
// ============================================================================

const kegiatanApi = {
    getAll: async function(filters = {}) {
        try {
            var query = db.from('kegiatan')
                .select('*, wilayah:wilayah_id(nama)')
                .order('tanggal_mulai', { ascending: false });

            if (filters.wilayah_id) query = query.eq('wilayah_id', safeInt(filters.wilayah_id));
            if (filters.status) query = query.eq('status', filters.status);

            var { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat kegiatan');
            return [];
        }
    },

    getById: async function(id) {
        try {
            var { data, error } = await db.from('kegiatan')
                .select('*, wilayah:wilayah_id(nama)')
                .eq('id', safeInt(id))
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            handleApiError(error, 'Gagal memuat kegiatan');
            return null;
        }
    },

    create: async function(data) {
        try {
            var { data: result, error } = await db.from('kegiatan')
                .insert(data)
                .select('id')
                .single();
            if (error) throw error;
            return result?.id || null;
        } catch (error) {
            handleApiError(error, 'Gagal membuat kegiatan');
            return null;
        }
    },

    update: async function(id, data) {
        try {
            var { error } = await db.from('kegiatan').update(data).eq('id', safeInt(id));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal update kegiatan');
            return false;
        }
    },

    delete: async function(id) {
        try {
            await db.from('peserta_kegiatan').delete().eq('kegiatan_id', safeInt(id));
            var { error } = await db.from('kegiatan').delete().eq('id', safeInt(id));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal hapus kegiatan');
            return false;
        }
    },

    getPeserta: async function(kegiatanId) {
        try {
            var { data, error } = await db.from('peserta_kegiatan')
                .select('*, jamaah:jamaah_id(id, nama, jenis_kelamin)')
                .eq('kegiatan_id', safeInt(kegiatanId));
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat peserta');
            return [];
        }
    },

    addPeserta: async function(kegiatanId, jamaahId) {
        try {
            var { error } = await db.from('peserta_kegiatan').insert({
                kegiatan_id: safeInt(kegiatanId),
                jamaah_id: safeInt(jamaahId),
                status: 'terdaftar'
            });
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal tambah peserta');
            return false;
        }
    },

    removePeserta: async function(pesertaId) {
        try {
            var { error } = await db.from('peserta_kegiatan').delete().eq('id', safeInt(pesertaId));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal hapus peserta');
            return false;
        }
    }
};

window.kegiatanApi = kegiatanApi;

// ============================================================================
// KAKAK ASUH API
// ============================================================================

const kakakAsuhApi = {
    getAll: async function(filters = {}) {
        try {
            var query = db.from('kakak_asuh')
                .select('*, kakak:kakak_id(id, nama, jenis_kelamin), adik:adik_id(id, nama, jenis_kelamin), wilayah:wilayah_id(nama)')
                .order('created_at', { ascending: false });

            if (filters.wilayah_id) query = query.eq('wilayah_id', safeInt(filters.wilayah_id));
            if (filters.status) query = query.eq('status', filters.status);

            var { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat kakak asuh');
            return [];
        }
    },

    create: async function(data) {
        try {
            var { error } = await db.from('kakak_asuh').insert(data);
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal membuat kakak asuh');
            return false;
        }
    },

    update: async function(id, data) {
        try {
            var { error } = await db.from('kakak_asuh').update(data).eq('id', safeInt(id));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal update kakak asuh');
            return false;
        }
    },

    delete: async function(id) {
        try {
            var { error } = await db.from('kakak_asuh').delete().eq('id', safeInt(id));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal hapus kakak asuh');
            return false;
        }
    },

    selesaikan: async function(id) {
        try {
            var { error } = await db.from('kakak_asuh')
                .update({ status: 'selesai', tanggal_selesai: new Date().toISOString().split('T')[0] })
                .eq('id', safeInt(id));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal selesaikan');
            return false;
        }
    }
};

window.kakakAsuhApi = kakakAsuhApi;

// ============================================================================
// LIMA UNSUR API
// ============================================================================

const limaUnsurApi = {
    getAll: async function(filters = {}) {
        try {
            var query = db.from('lima_unsur')
                .select('*, jamaah:jamaah_id(id, nama, jenis_kelamin), wilayah:wilayah_id(nama, tingkat)')
                .eq('is_aktif', true);

            if (filters.wilayah_id) query = query.eq('wilayah_id', safeInt(filters.wilayah_id));
            if (filters.tahun_ajaran_id) query = query.eq('tahun_ajaran_id', safeInt(filters.tahun_ajaran_id));
            if (filters.jenis) query = query.eq('jenis', filters.jenis);

            var { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            handleApiError(error, 'Gagal memuat lima unsur');
            return [];
        }
    },

    getByWilayah: async function(wilayahId, tahunAjaranId) {
        try {
            var query = db.from('lima_unsur')
                .select('*, jamaah:jamaah_id(id, nama, jenis_kelamin)')
                .eq('wilayah_id', safeInt(wilayahId))
                .eq('is_aktif', true);

            if (tahunAjaranId) query = query.eq('tahun_ajaran_id', safeInt(tahunAjaranId));

            var { data, error } = await query;
            if (error) throw error;

            var result = {};
            (data || []).forEach(function(u) {
                result[u.jenis] = u;
            });
            return result;
        } catch (error) {
            handleApiError(error, 'Gagal memuat lima unsur');
            return {};
        }
    },

    save: async function(data) {
        try {
            if (data.id) {
                var { error } = await db.from('lima_unsur').update(data).eq('id', safeInt(data.id));
                if (error) throw error;
            } else {
                var { error } = await db.from('lima_unsur').insert(data);
                if (error) throw error;
            }
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal simpan lima unsur');
            return false;
        }
    },

    delete: async function(id) {
        try {
            var { error } = await db.from('lima_unsur').delete().eq('id', safeInt(id));
            if (error) throw error;
            return true;
        } catch (error) {
            handleApiError(error, 'Gagal hapus');
            return false;
        }
    }
};

window.limaUnsurApi = limaUnsurApi;

// Export helper juga
window.safeInt = safeInt;
