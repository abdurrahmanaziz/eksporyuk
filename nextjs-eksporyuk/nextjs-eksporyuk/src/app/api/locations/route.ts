import { NextRequest, NextResponse } from 'next/server'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// Data provinsi dan kota Indonesia
export const INDONESIA_LOCATIONS = {
  "Aceh": ["Banda Aceh", "Langsa", "Lhokseumawe", "Sabang", "Subulussalam", "Aceh Barat", "Aceh Barat Daya", "Aceh Besar", "Aceh Jaya", "Aceh Selatan", "Aceh Singkil", "Aceh Tamiang", "Aceh Tengah", "Aceh Tenggara", "Aceh Timur", "Aceh Utara", "Bener Meriah", "Bireuen", "Gayo Lues", "Nagan Raya", "Pidie", "Pidie Jaya", "Simeulue"],
  "Sumatera Utara": ["Medan", "Binjai", "Gunungsitoli", "Padang Sidempuan", "Pematang Siantar", "Sibolga", "Tanjung Balai", "Tebing Tinggi", "Asahan", "Batubara", "Dairi", "Deli Serdang", "Humbang Hasundutan", "Karo", "Labuhanbatu", "Labuhanbatu Selatan", "Labuhanbatu Utara", "Langkat", "Mandailing Natal", "Nias", "Nias Barat", "Nias Selatan", "Nias Utara", "Padang Lawas", "Padang Lawas Utara", "Pakpak Bharat", "Samosir", "Serdang Bedagai", "Simalungun", "Tapanuli Selatan", "Tapanuli Tengah", "Tapanuli Utara", "Toba Samosir"],
  "Sumatera Barat": ["Padang", "Bukittinggi", "Padang Panjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok", "Agam", "Dharmasraya", "Kepulauan Mentawai", "Lima Puluh Kota", "Padang Pariaman", "Pasaman", "Pasaman Barat", "Pesisir Selatan", "Sijunjung", "Solok", "Solok Selatan", "Tanah Datar"],
  "Riau": ["Pekanbaru", "Dumai", "Bengkalis", "Indragiri Hilir", "Indragiri Hulu", "Kampar", "Kepulauan Meranti", "Kuantan Singingi", "Pelalawan", "Rokan Hilir", "Rokan Hulu", "Siak"],
  "Kepulauan Riau": ["Batam", "Tanjung Pinang", "Bintan", "Karimun", "Kepulauan Anambas", "Lingga", "Natuna"],
  "Jambi": ["Jambi", "Sungai Penuh", "Batang Hari", "Bungo", "Kerinci", "Merangin", "Muaro Jambi", "Sarolangun", "Tanjung Jabung Barat", "Tanjung Jabung Timur", "Tebo"],
  "Sumatera Selatan": ["Palembang", "Lubuklinggau", "Pagar Alam", "Prabumulih", "Banyuasin", "Empat Lawang", "Lahat", "Muara Enim", "Musi Banyuasin", "Musi Rawas", "Musi Rawas Utara", "Ogan Ilir", "Ogan Komering Ilir", "Ogan Komering Ulu", "Ogan Komering Ulu Selatan", "Ogan Komering Ulu Timur", "Penukal Abab Lematang Ilir"],
  "Bangka Belitung": ["Pangkal Pinang", "Bangka", "Bangka Barat", "Bangka Selatan", "Bangka Tengah", "Belitung", "Belitung Timur"],
  "Bengkulu": ["Bengkulu", "Bengkulu Selatan", "Bengkulu Tengah", "Bengkulu Utara", "Kaur", "Kepahiang", "Lebong", "Mukomuko", "Rejang Lebong", "Seluma"],
  "Lampung": ["Bandar Lampung", "Metro", "Lampung Barat", "Lampung Selatan", "Lampung Tengah", "Lampung Timur", "Lampung Utara", "Mesuji", "Pesawaran", "Pesisir Barat", "Pringsewu", "Tanggamus", "Tulang Bawang", "Tulang Bawang Barat", "Way Kanan"],
  "DKI Jakarta": ["Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara", "Kepulauan Seribu"],
  "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya", "Bandung Barat", "Bandung", "Bekasi", "Bogor", "Ciamis", "Cianjur", "Cirebon", "Garut", "Indramayu", "Karawang", "Kuningan", "Majalengka", "Pangandaran", "Purwakarta", "Subang", "Sukabumi", "Sumedang", "Tasikmalaya"],
  "Banten": ["Cilegon", "Serang", "Tangerang", "Tangerang Selatan", "Lebak", "Pandeglang", "Serang", "Tangerang"],
  "Jawa Tengah": ["Semarang", "Magelang", "Pekalongan", "Salatiga", "Surakarta", "Tegal", "Banjarnegara", "Banyumas", "Batang", "Blora", "Boyolali", "Brebes", "Cilacap", "Demak", "Grobogan", "Jepara", "Karanganyar", "Kebumen", "Kendal", "Klaten", "Kudus", "Magelang", "Pati", "Pekalongan", "Pemalang", "Purbalingga", "Purworejo", "Rembang", "Semarang", "Sragen", "Sukoharjo", "Tegal", "Temanggung", "Wonogiri", "Wonosobo"],
  "DI Yogyakarta": ["Yogyakarta", "Bantul", "Gunung Kidul", "Kulon Progo", "Sleman"],
  "Jawa Timur": ["Surabaya", "Batu", "Blitar", "Kediri", "Madiun", "Malang", "Mojokerto", "Pasuruan", "Probolinggo", "Bangkalan", "Banyuwangi", "Blitar", "Bojonegoro", "Bondowoso", "Gresik", "Jember", "Jombang", "Kediri", "Lamongan", "Lumajang", "Madiun", "Magetan", "Malang", "Mojokerto", "Nganjuk", "Ngawi", "Pacitan", "Pamekasan", "Pasuruan", "Ponorogo", "Probolinggo", "Sampang", "Sidoarjo", "Situbondo", "Sumenep", "Trenggalek", "Tuban", "Tulungagung"],
  "Bali": ["Denpasar", "Badung", "Bangli", "Buleleng", "Gianyar", "Jembrana", "Karangasem", "Klungkung", "Tabanan"],
  "Nusa Tenggara Barat": ["Mataram", "Bima", "Bima", "Dompu", "Lombok Barat", "Lombok Tengah", "Lombok Timur", "Lombok Utara", "Sumbawa", "Sumbawa Barat"],
  "Nusa Tenggara Timur": ["Kupang", "Alor", "Belu", "Ende", "Flores Timur", "Kupang", "Lembata", "Malaka", "Manggarai", "Manggarai Barat", "Manggarai Timur", "Nagekeo", "Ngada", "Rote Ndao", "Sabu Raijua", "Sikka", "Sumba Barat", "Sumba Barat Daya", "Sumba Tengah", "Sumba Timur", "Timor Tengah Selatan", "Timor Tengah Utara"],
  "Kalimantan Barat": ["Pontianak", "Singkawang", "Bengkayang", "Kapuas Hulu", "Kayong Utara", "Ketapang", "Kubu Raya", "Landak", "Melawi", "Mempawah", "Sambas", "Sanggau", "Sekadau", "Sintang"],
  "Kalimantan Tengah": ["Palangkaraya", "Barito Selatan", "Barito Timur", "Barito Utara", "Gunung Mas", "Kapuas", "Katingan", "Kotawaringin Barat", "Kotawaringin Timur", "Lamandau", "Murung Raya", "Pulang Pisau", "Seruyan", "Sukamara"],
  "Kalimantan Selatan": ["Banjarmasin", "Banjarbaru", "Balangan", "Banjar", "Barito Kuala", "Hulu Sungai Selatan", "Hulu Sungai Tengah", "Hulu Sungai Utara", "Kotabaru", "Tabalong", "Tanah Bumbu", "Tanah Laut", "Tapin"],
  "Kalimantan Timur": ["Samarinda", "Balikpapan", "Bontang", "Berau", "Kutai Barat", "Kutai Kartanegara", "Kutai Timur", "Mahakam Ulu", "Paser", "Penajam Paser Utara"],
  "Kalimantan Utara": ["Tarakan", "Bulungan", "Malinau", "Nunukan", "Tana Tidung"],
  "Sulawesi Utara": ["Manado", "Bitung", "Kotamobagu", "Tomohon", "Bolaang Mongondow", "Bolaang Mongondow Selatan", "Bolaang Mongondow Timur", "Bolaang Mongondow Utara", "Kepulauan Sangihe", "Kepulauan Siau Tagulandang Biaro", "Kepulauan Talaud", "Minahasa", "Minahasa Selatan", "Minahasa Tenggara", "Minahasa Utara"],
  "Gorontalo": ["Gorontalo", "Boalemo", "Bone Bolango", "Gorontalo", "Gorontalo Utara", "Pohuwato"],
  "Sulawesi Tengah": ["Palu", "Banggai", "Banggai Kepulauan", "Banggai Laut", "Buol", "Donggala", "Morowali", "Morowali Utara", "Parigi Moutong", "Poso", "Sigi", "Tojo Una-Una", "Tolitoli"],
  "Sulawesi Selatan": ["Makassar", "Palopo", "Parepare", "Bantaeng", "Barru", "Bone", "Bulukumba", "Enrekang", "Gowa", "Jeneponto", "Kepulauan Selayar", "Luwu", "Luwu Timur", "Luwu Utara", "Maros", "Pangkajene dan Kepulauan", "Pinrang", "Sidenreng Rappang", "Sinjai", "Soppeng", "Takalar", "Tana Toraja", "Toraja Utara", "Wajo"],
  "Sulawesi Tenggara": ["Kendari", "Bau-Bau", "Bombana", "Buton", "Buton Selatan", "Buton Tengah", "Buton Utara", "Kolaka", "Kolaka Timur", "Kolaka Utara", "Konawe", "Konawe Kepulauan", "Konawe Selatan", "Konawe Utara", "Muna", "Muna Barat", "Wakatobi"],
  "Sulawesi Barat": ["Mamuju", "Majene", "Mamasa", "Mamuju", "Mamuju Tengah", "Mamuju Utara", "Polewali Mandar"],
  "Maluku": ["Ambon", "Tual", "Buru", "Buru Selatan", "Kepulauan Aru", "Maluku Barat Daya", "Maluku Tengah", "Maluku Tenggara", "Maluku Tenggara Barat", "Seram Bagian Barat", "Seram Bagian Timur"],
  "Maluku Utara": ["Ternate", "Tidore Kepulauan", "Halmahera Barat", "Halmahera Selatan", "Halmahera Tengah", "Halmahera Timur", "Halmahera Utara", "Kepulauan Sula", "Pulau Morotai", "Pulau Taliabu"],
  "Papua": ["Jayapura", "Biak Numfor", "Jayapura", "Jayawijaya", "Keerom", "Kepulauan Yapen", "Lanny Jaya", "Mamberamo Raya", "Mamberamo Tengah", "Nduga", "Paniai", "Pegunungan Bintang", "Puncak", "Puncak Jaya", "Sarmi", "Supiori", "Tolikara", "Waropen", "Yalimo", "Yahukimo"],
  "Papua Barat": ["Manokwari", "Sorong", "Fakfak", "Kaimana", "Manokwari", "Manokwari Selatan", "Maybrat", "Pegunungan Arfak", "Raja Ampat", "Sorong", "Sorong Selatan", "Tambrauw", "Teluk Bintuni", "Teluk Wondama"],
  "Papua Selatan": ["Merauke", "Asmat", "Boven Digoel", "Mappi"],
  "Papua Tengah": ["Nabire", "Deiyai", "Dogiyai", "Intan Jaya", "Mimika", "Paniai", "Puncak"],
  "Papua Pegunungan": ["Wamena", "Jayawijaya", "Lanny Jaya", "Mamberamo Tengah", "Nduga", "Pegunungan Bintang", "Tolikara", "Yalimo", "Yahukimo"],
  "Papua Barat Daya": ["Sorong", "Maybrat", "Raja Ampat", "Sorong Selatan", "Tambrauw"]
}

// GET - Fetch provinces and cities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const province = searchParams.get('province')

    if (province) {
      // Return cities for specific province
      const cities = INDONESIA_LOCATIONS[province as keyof typeof INDONESIA_LOCATIONS] || []
      return NextResponse.json({
        province,
        cities: [...new Set(cities)].sort() // Remove duplicates and sort
      })
    }

    // Return all provinces with their cities
    const provinces = Object.entries(INDONESIA_LOCATIONS)
      .map(([name, cities]) => ({
        name,
        cities: [...new Set(cities)].sort() // Remove duplicates and sort
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    
    return NextResponse.json({
      provinces
    })

  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}
