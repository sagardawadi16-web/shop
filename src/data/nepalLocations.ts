// ============================================================
// Nepal Hierarchical Location Dataset
// Province -> District -> Municipality -> Wards -> Popular Toles
// ============================================================

export interface MunicipalityInfo {
  name: string;
  nameNp: string;
  type: 'Metropolitan' | 'Sub-Metropolitan' | 'Municipality' | 'Rural Municipality';
  totalWards: number;
  popularToles?: string[];
}

export interface DistrictInfo {
  name: string;
  nameNp: string;
  municipalities: MunicipalityInfo[];
}

export interface ProvinceInfo {
  id: string;
  name: string;
  nameNp: string;
  districts: DistrictInfo[];
}

export const NEPAL_LOCATION_HIERARCHY: ProvinceInfo[] = [
  {
    id: 'bagmati',
    name: 'Bagmati Province',
    nameNp: 'बागमती प्रदेश',
    districts: [
      {
        name: 'Chitwan',
        nameNp: 'चितवन',
        municipalities: [
          {
            name: 'Bharatpur Metropolitan',
            nameNp: 'भरतपुर महानगरपालिका',
            type: 'Metropolitan',
            totalWards: 29,
            popularToles: [
              'Lions Chowk',
              'Hakim Chowk',
              'Chaubiskothi',
              'Paras Buspark',
              'Narayangarh Bazar',
              'Bharatpur Heights',
              'Malpot Chowk',
              'Krishnapur',
              'Baseni',
              'Bypass Road',
              'Diyalo Bangala Area',
              'Ramnagar',
              'Sahid Chowk',
              'Ganesthan',
              'Aaptari',
              'Bhojad',
              'Deepnagar',
              'Gitanagar',
              'Patihani',
              'Chanauli',
              'Meghauli',
              'Sharda Nagar',
            ],
          },
          {
            name: 'Ratnanagar Municipality',
            nameNp: 'रत्ननगर नगरपालिका',
            type: 'Municipality',
            totalWards: 16,
            popularToles: ['Tandi Bazar', 'Sauraha', 'Bakulahar', 'Belsi', 'Shanti Chowk', 'Kalyanpur', 'Pithuwa'],
          },
          {
            name: 'Khairahani Municipality',
            nameNp: 'खैरहनी नगरपालिका',
            type: 'Municipality',
            totalWards: 13,
            popularToles: ['Parsa Bazar', 'Khairahani', 'Lothar Chowk', 'Kumroj', 'Sultana'],
          },
          {
            name: 'Rapti Municipality',
            nameNp: 'राप्ती नगरपालिका',
            type: 'Municipality',
            totalWards: 13,
            popularToles: ['Bhandara Bazar', 'Piple', 'Birendranagar', 'Hardigatha'],
          },
          {
            name: 'Kalika Municipality',
            nameNp: 'कालिका नगरपालिका',
            type: 'Municipality',
            totalWards: 11,
            popularToles: ['Kholpur', 'Padampur', 'Jutpani', 'Saktikhor'],
          },
          {
            name: 'Madi Municipality',
            nameNp: 'माडी नगरपालिका',
            type: 'Municipality',
            totalWards: 9,
            popularToles: ['Basantapur', 'Bagai', 'Baruwa', 'Kalyanpur'],
          },
          {
            name: 'Ichchhakamana Rural Municipality',
            nameNp: 'इच्छाकामना गाउँपालिका',
            type: 'Rural Municipality',
            totalWards: 7,
            popularToles: ['Mugling Bazar', 'Kurintar', 'Chumlingtar'],
          },
        ],
      },
      {
        name: 'Kathmandu',
        nameNp: 'काठमाडौं',
        municipalities: [
          {
            name: 'Kathmandu Metropolitan',
            nameNp: 'काठमाडौं महानगरपालिका',
            type: 'Metropolitan',
            totalWards: 32,
            popularToles: [
              'New Road',
              'Thamel',
              'Lazimpat',
              'New Baneshwor',
              'Old Baneshwor',
              'Koteshwor',
              'Kalanki',
              'Maharajgunj',
              'Baluwatar',
              'Chabahil',
              'Putalisadak',
              'Maitighar',
              'Sinamangal',
              'Durbarmarg',
              'Tripureshwor',
              'Asan',
              'Tinkune',
              'Boudha',
              'Samakhusi',
              'Gongabu Buspark',
              'Teku',
              'Kalimati',
              'Balkhu',
              'Basundhara',
              'Bhatbhateni',
            ],
          },
          {
            name: 'Kirtipur Municipality',
            nameNp: 'कीर्तिपुर नगरपालिका',
            type: 'Municipality',
            totalWards: 10,
            popularToles: ['Naya Bazaar', 'TU Campus Gate', 'Panga', 'Chobhar', 'Tyanglaphat'],
          },
          {
            name: 'Budhanilkantha Municipality',
            nameNp: 'बुढानीलकण्ठ नगरपालिका',
            type: 'Municipality',
            totalWards: 13,
            popularToles: ['Hattigauda', 'Mandikhatar', 'Golfutar', 'Chunikhel', 'Narayanthan'],
          },
          {
            name: 'Tokha Municipality',
            nameNp: 'टोखा नगरपालिका',
            type: 'Municipality',
            totalWards: 11,
            popularToles: ['Grandee Hospital Area', 'Tokha Saraswati', 'Dhapasi', 'Baniyatar'],
          },
          {
            name: 'Chandragiri Municipality',
            nameNp: 'चन्द्रागिरि नगरपालिका',
            type: 'Municipality',
            totalWards: 15,
            popularToles: ['Thankot', 'Gurjudhara', 'Naikap', 'Kisipidhi', 'Matatirtha'],
          },
          {
            name: 'Tarakeshwor Municipality',
            nameNp: 'तारकेश्वर नगरपालिका',
            type: 'Municipality',
            totalWards: 11,
            popularToles: ['Manamaiju', 'Dharmasthali', 'Goldhunga', 'Phutung'],
          },
          {
            name: 'Nagarjun Municipality',
            nameNp: 'नागार्जुन नगरपालिका',
            type: 'Municipality',
            totalWards: 10,
            popularToles: ['Sitapaila', 'Ramkot', 'Syuchatar', 'Ichhangunarayan'],
          },
          {
            name: 'Gokarneshwor Municipality',
            nameNp: 'गोकर्णेश्वर नगरपालिका',
            type: 'Municipality',
            totalWards: 9,
            popularToles: ['Jorpati', 'Besigaon', 'Narayan Chowk', 'Sundarijal'],
          },
          {
            name: 'Kageshwori Manohara Municipality',
            nameNp: 'कागेश्वरी मनोहरा',
            type: 'Municipality',
            totalWards: 9,
            popularToles: ['Mulpani', 'Thali', 'Gothatar', 'Kandaghari'],
          },
          {
            name: 'Shankharapur Municipality',
            nameNp: 'शंखरापुर नगरपालिका',
            type: 'Municipality',
            totalWards: 9,
            popularToles: ['Sankhu Bazar', 'Kattike', 'Jharuwarasi'],
          },
          {
            name: 'Dakshinkali Municipality',
            nameNp: 'दक्षिणकाली नगरपालिका',
            type: 'Municipality',
            totalWards: 9,
            popularToles: ['Pharping Bazar', 'Dakshinkali Temple Area', 'Sheshnarayan'],
          },
        ],
      },
      {
        name: 'Lalitpur',
        nameNp: 'ललितपुर',
        municipalities: [
          {
            name: 'Lalitpur Metropolitan',
            nameNp: 'ललितपुर महानगरपालिका',
            type: 'Metropolitan',
            totalWards: 29,
            popularToles: [
              'Patan Durbar Square',
              'Pulchowk',
              'Jhamsikhel',
              'Jawalakhel',
              'Kumaripati',
              'Satdobato',
              'Gwarko',
              'Lagankhel',
              'Kupondole',
              'Sanepa',
              'Bakhundole',
              'Mangalbazar',
              'Balkumari',
              'Dhapakhel',
              'Sunakothi',
            ],
          },
          {
            name: 'Mahalaxmi Municipality',
            nameNp: 'महालक्ष्मी नगरपालिका',
            type: 'Municipality',
            totalWards: 10,
            popularToles: ['Imadol', 'Lubhu', 'Tikathali', 'Siddhi Ganesh Chowk'],
          },
          {
            name: 'Godawari Municipality',
            nameNp: 'गोदावरी नगरपालिका',
            type: 'Municipality',
            totalWards: 14,
            popularToles: ['Bajrabarahi', 'Godawari Botanical Garden', 'Thecho', 'Harisiddhi', 'Badikhel'],
          },
        ],
      },
      {
        name: 'Bhaktapur',
        nameNp: 'भक्तपुर',
        municipalities: [
          {
            name: 'Bhaktapur Municipality',
            nameNp: 'भक्तपुर नगरपालिका',
            type: 'Municipality',
            totalWards: 10,
            popularToles: ['Durbar Square', 'Kamalbinayak', 'Byasi', 'Taumadhi', 'Doodhpati'],
          },
          {
            name: 'Madhyapur Thimi Municipality',
            nameNp: 'मध्यपुर थिमी नगरपालिका',
            type: 'Municipality',
            totalWards: 9,
            popularToles: ['Thimi Bazar', 'Lokanthali', 'Radhe Radhe', 'Sanothimi', 'Gatthaghar', 'Kaushaltar'],
          },
          {
            name: 'Suryabinayak Municipality',
            nameNp: 'सूर्यविनायक नगरपालिका',
            type: 'Municipality',
            totalWards: 10,
            popularToles: ['Sallaghari', 'Katunje', 'Jagati', 'Pandubazar', 'Sipadole'],
          },
          {
            name: 'Changunarayan Municipality',
            nameNp: 'चाँगुनारायण नगरपालिका',
            type: 'Municipality',
            totalWards: 9,
            popularToles: ['Duwakot', 'Jhaukhel', 'Changu Temple Area', 'Bageshwori'],
          },
        ],
      },
      {
        name: 'Makwanpur',
        nameNp: 'मकवानपुर',
        municipalities: [
          {
            name: 'Hetauda Sub-Metropolitan',
            nameNp: 'हेटौंडा उपमहानगरपालिका',
            type: 'Sub-Metropolitan',
            totalWards: 19,
            popularToles: ['Sanopokhara', 'Huprachaur', 'Buspark Road', 'Kantirajpath', 'Chaughada', 'Hatiya', 'Pashupatinagar'],
          },
          {
            name: 'Thaha Municipality',
            nameNp: 'थाहा नगरपालिका',
            type: 'Municipality',
            totalWards: 12,
            popularToles: ['Palung', 'Daman', 'Bajrabarahi', 'Sikharpur'],
          },
        ],
      },
      {
        name: 'Kavrepalanchok',
        nameNp: 'काभ्रेपलाञ्चोक',
        municipalities: [
          {
            name: 'Dhulikhel Municipality',
            nameNp: 'धुलिखेल नगरपालिका',
            type: 'Municipality',
            totalWards: 12,
            popularToles: ['Bhattedanda', 'Dhulikhel Hospital Area', 'Sanjivani'],
          },
          {
            name: 'Banepa Municipality',
            nameNp: 'बनेपा नगरपालिका',
            type: 'Municipality',
            totalWards: 14,
            popularToles: ['Chardobato', 'Chandeshwori', 'Godamchaur', 'Nala'],
          },
          {
            name: 'Panauti Municipality',
            nameNp: 'पनौती नगरपालिका',
            type: 'Municipality',
            totalWards: 12,
            popularToles: ['Triveni Ghat', 'Khopasi', 'Balthali gate'],
          },
        ],
      },
      {
        name: 'Dhading',
        nameNp: 'धादिङ',
        municipalities: [
          {
            name: 'Nilkantha Municipality',
            nameNp: 'नीलकण्ठ नगरपालिका',
            type: 'Municipality',
            totalWards: 14,
            popularToles: ['Dhading Besi', 'Bich Bazar', 'Puchhar Bazar', 'Sankosh'],
          },
          {
            name: 'Dhunibesi Municipality',
            nameNp: 'धुनीबेंसी नगरपालिका',
            type: 'Municipality',
            totalWards: 9,
            popularToles: ['Khanikhola', 'Naubise', 'Chhatredeurali'],
          },
        ],
      },
      {
        name: 'Nuwakot',
        nameNp: 'नुवाकोट',
        municipalities: [
          {
            name: 'Bidur Municipality',
            nameNp: 'विदुर नगरपालिका',
            type: 'Municipality',
            totalWards: 13,
            popularToles: ['Trishuli Bazar', 'Battar', 'Bidur', 'Inarpati'],
          },
        ],
      },
      { name: 'Sindhupalchok', nameNp: 'सिन्धुपाल्चोक', municipalities: [{ name: 'Chautara Sangachokgadhi', nameNp: 'चौतारा', type: 'Municipality', totalWards: 14, popularToles: ['Chautara Bazar', 'Sangachok'] }] },
      { name: 'Sindhuli', nameNp: 'सिन्धुली', municipalities: [{ name: 'Kamalamai Municipality', nameNp: 'कमलामाई', type: 'Municipality', totalWards: 14, popularToles: ['Sindhulimadhi', 'Madi Bazar'] }] },
      { name: 'Ramechhap', nameNp: 'रामेछाप', municipalities: [{ name: 'Manthali Municipality', nameNp: 'मन्थली', type: 'Municipality', totalWards: 14, popularToles: ['Manthali Bazar', 'Airport Area'] }] },
      { name: 'Dolakha', nameNp: 'दोलखा', municipalities: [{ name: 'Bhimeshwar Municipality', nameNp: 'भीमेश्वर (चरीकोट)', type: 'Municipality', totalWards: 9, popularToles: ['Charikot Bazar', 'Dolakha Bazar'] }] },
      { name: 'Rasuwa', nameNp: 'रसुवा', municipalities: [{ name: 'Kalika Rural Municipality', nameNp: 'कालिका', type: 'Rural Municipality', totalWards: 5, popularToles: ['Dhunche', 'Syaphrubesi'] }] },
    ],
  },
  {
    id: 'koshi',
    name: 'Koshi Province',
    nameNp: 'कोशी प्रदेश',
    districts: [
      {
        name: 'Morang',
        nameNp: 'मोरङ',
        municipalities: [
          {
            name: 'Biratnagar Metropolitan',
            nameNp: 'विराटनगर महानगरपालिका',
            type: 'Metropolitan',
            totalWards: 19,
            popularToles: ['Main Road', 'Traffic Chowk', 'Roadcess Chowk', 'Tintolia', 'Rani Gate', 'Bargachhi', 'Kanchanbari', 'Devkota Chowk'],
          },
          { name: 'Belbari Municipality', nameNp: 'बेलबारी', type: 'Municipality', totalWards: 11, popularToles: ['Belbari Bazar', 'Laxmimarga'] },
          { name: 'Urlabari Municipality', nameNp: 'उर्लाबारी', type: 'Municipality', totalWards: 9, popularToles: ['Urlabari Chowk', 'Madhumalla road'] },
          { name: 'Sundarharaicha Municipality', nameNp: 'सुन्दरहरैंचा', type: 'Municipality', totalWards: 12, popularToles: ['Biratchowk', 'Salakpur', 'Gothgaun'] },
        ],
      },
      {
        name: 'Sunsari',
        nameNp: 'सुनसरी',
        municipalities: [
          {
            name: 'Dharan Sub-Metropolitan',
            nameNp: 'धरान उपमहानगरपालिका',
            type: 'Sub-Metropolitan',
            totalWards: 20,
            popularToles: ['Bhanuchowk', 'Chhata Chowk', 'BPKIHS Hospital Area', 'Putali Line', 'Singhadurbar Chowk', 'Amarhat', 'Dharan-10 Buspark'],
          },
          {
            name: 'Itahari Sub-Metropolitan',
            nameNp: 'इटहरी उपमहानगरपालिका',
            type: 'Sub-Metropolitan',
            totalWards: 20,
            popularToles: ['Main Chowk', 'West Line', 'Gothgaun Road', 'Tarahara', 'Pachhiwani', 'Khanar'],
          },
          { name: 'Inaruwa Municipality', nameNp: 'इनरुवा', type: 'Municipality', totalWards: 10, popularToles: ['Inaruwa Bazar', 'Buspark'] },
        ],
      },
      {
        name: 'Jhapa',
        nameNp: 'झापा',
        municipalities: [
          {
            name: 'Birtamode Municipality',
            nameNp: 'बिर्तामोड नगरपालिका',
            type: 'Municipality',
            totalWards: 10,
            popularToles: ['Mukti Chowk', 'Bhadrapur Road', 'Sanischare Road', 'Anarmani', 'Buspark Area', 'Charpane'],
          },
          {
            name: 'Damak Municipality',
            nameNp: 'दमक नगरपालिका',
            type: 'Municipality',
            totalWards: 10,
            popularToles: ['Thana Road', 'Gaukhali', 'Damak Chowk', 'Beldangi Road'],
          },
          { name: 'Mechinagar Municipality', nameNp: 'मेचीनगर (काँकडभिट्टा)', type: 'Municipality', totalWards: 15, popularToles: ['Kakarvitta Gate', 'Dhulabari Bazar', 'Charali'] },
          { name: 'Bhadrapur Municipality', nameNp: 'भद्रपुर', type: 'Municipality', totalWards: 10, popularToles: ['Bhadrapur Bazar', 'Airport Area', 'Chandragadhi'] },
        ],
      },
      { name: 'Ilam', nameNp: 'इलाम', municipalities: [{ name: 'Ilam Municipality', nameNp: 'इलाम नगरपालिका', type: 'Municipality', totalWards: 12, popularToles: ['Ilam Bazar', 'Chowk Bazar'] }] },
      { name: 'Udayapur', nameNp: 'उदयपुर', municipalities: [{ name: 'Triyuga Municipality', nameNp: 'त्रियुगा (गाइघाट)', type: 'Municipality', totalWards: 16, popularToles: ['Gaighat Bazar', 'Main Chowk'] }] },
      { name: 'Dhankuta', nameNp: 'धनकुटा', municipalities: [{ name: 'Dhankuta Municipality', nameNp: 'धनकुटा', type: 'Municipality', totalWards: 10, popularToles: ['Hile Bazar', 'Dhankuta Bazar'] }] },
    ],
  },
  {
    id: 'madhesh',
    name: 'Madhesh Province',
    nameNp: 'मधेश प्रदेश',
    districts: [
      {
        name: 'Parsa',
        nameNp: 'पर्सा',
        municipalities: [
          {
            name: 'Birgunj Metropolitan',
            nameNp: 'वीरगन्ज महानगरपालिका',
            type: 'Metropolitan',
            totalWards: 32,
            popularToles: ['Adarshanagar', 'Ghantaghar Chowk', 'Maisthan', 'Powerhouse Chowk', 'Customs Gate (Raxaul Border)', 'Murli', 'Ranighat', 'Alau', 'Gandak'],
          },
        ],
      },
      {
        name: 'Dhanusha',
        nameNp: 'धनुषा',
        municipalities: [
          {
            name: 'Janakpurdham Sub-Metropolitan',
            nameNp: 'जनकपुरधाम उपमहानगरपालिका',
            type: 'Sub-Metropolitan',
            totalWards: 25,
            popularToles: ['Janaki Mandir Area', 'Ramanand Chowk', 'Bhanu Chowk', 'Shiva Chowk', 'Station Road', 'Muralichowk', 'Pidari Chowk'],
          },
        ],
      },
      {
        name: 'Bara',
        nameNp: 'बारा',
        municipalities: [
          { name: 'Kalaiya Sub-Metropolitan', nameNp: 'कलैया', type: 'Sub-Metropolitan', totalWards: 27, popularToles: ['Bharat Chowk', 'Adalat Road'] },
          { name: 'Jitpur Simara Sub-Metropolitan', nameNp: 'जीतपुर सिमरा', type: 'Sub-Metropolitan', totalWards: 24, popularToles: ['Simara Bazar', 'Jitpur Main Chowk'] },
        ],
      },
      { name: 'Rautahat', nameNp: 'रौतहट', municipalities: [{ name: 'Chandrapur Municipality', nameNp: 'चन्द्रपुर (चन्द्रनिगाहपुर)', type: 'Municipality', totalWards: 10, popularToles: ['Chandranigahpur Chowk', 'Santapur'] }] },
      { name: 'Siraha', nameNp: 'सिराहा', municipalities: [{ name: 'Lahan Municipality', nameNp: 'लहान', type: 'Municipality', totalWards: 24, popularToles: ['Hospital Chowk', 'Shahid Chowk', 'Bazar Area'] }] },
      { name: 'Mahottari', nameNp: 'महोत्तरी', municipalities: [{ name: 'Jaleshwar Municipality', nameNp: 'जलेश्वर', type: 'Municipality', totalWards: 12, popularToles: ['Jaleshwar Bazar', 'Bhadur Chowk'] }, { name: 'Bardibas Municipality', nameNp: 'बर्दिबास', type: 'Municipality', totalWards: 14, popularToles: ['Bardibas Chowk', 'Main Highway'] }] },
      { name: 'Saptari', nameNp: 'सप्तरी', municipalities: [{ name: 'Rajbiraj Municipality', nameNp: 'राजविराज', type: 'Municipality', totalWards: 16, popularToles: ['Netaji Chowk', 'Tribhuvan Chowk'] }] },
      { name: 'Sarlahi', nameNp: 'सर्लाही', municipalities: [{ name: 'Malangwa Municipality', nameNp: 'मलङ्गवा', type: 'Municipality', totalWards: 12, popularToles: ['Malangwa Bazar'] }, { name: 'Lalbandi Municipality', nameNp: 'लालबन्दी', type: 'Municipality', totalWards: 17, popularToles: ['Lalbandi Chowk'] }] },
    ],
  },
  {
    id: 'gandaki',
    name: 'Gandaki Province',
    nameNp: 'गण्डकी प्रदेश',
    districts: [
      {
        name: 'Kaski',
        nameNp: 'कास्की',
        municipalities: [
          {
            name: 'Pokhara Metropolitan',
            nameNp: 'पोखरा महानगरपालिका',
            type: 'Metropolitan',
            totalWards: 33,
            popularToles: [
              'Lakeside',
              'Mahendrapool',
              'Chipledhunga',
              'Prithvi Chowk',
              'Bagar',
              'Biruta',
              'Srijana Chowk',
              'Amarsingh Chowk',
              'Rambazar',
              'Palikhe Chowk',
              'New Road',
              'Rastra Bank Chowk',
              'Chhorepatan',
              'Hemja',
              'Lamachaur',
              'Kundahar',
            ],
          },
        ],
      },
      {
        name: 'Nawalpur (Nawalparasi East)',
        nameNp: 'नवलपुर (नवलपरासी पूर्व)',
        municipalities: [
          {
            name: 'Gaindakot Municipality',
            nameNp: 'गैंडाकोट नगरपालिका',
            type: 'Municipality',
            totalWards: 18,
            popularToles: ['Gaindakot Chowk (Narayangarh Pulchok side)', 'Kaligandaki Chowk', 'Congress Chowk', 'Bhedualitar', 'Thumsi', 'Pitauji'],
          },
          {
            name: 'Kawasoti Municipality',
            nameNp: 'कावासोती नगरपालिका',
            type: 'Municipality',
            totalWards: 17,
            popularToles: ['Thana Chowk', 'Subha Chowk', 'Hasantar', 'Danda Bazar'],
          },
          { name: 'Devchuli Municipality', nameNp: 'देवचुली', type: 'Municipality', totalWards: 17, popularToles: ['Daldale Bazar', 'Pragatinagar'] },
          { name: 'Madhyabindu Municipality', nameNp: 'मध्यबिन्दु', type: 'Municipality', totalWards: 15, popularToles: ['Chormara Bazar'] },
        ],
      },
      {
        name: 'Tanahun',
        nameNp: 'तनहुँ',
        municipalities: [
          { name: 'Byas Municipality', nameNp: 'व्यास (दमौली)', type: 'Municipality', totalWards: 14, popularToles: ['Damauli Bazar', 'Main Chowk', 'Anbukhaireni link'] },
          { name: 'Shuklagandaki Municipality', nameNp: 'शुक्लागण्डकी', type: 'Municipality', totalWards: 12, popularToles: ['Khairenitar', 'Dulegaunda'] },
        ],
      },
      {
        name: 'Syangja',
        nameNp: 'स्याङ्जा',
        municipalities: [
          { name: 'Putalibazar Municipality', nameNp: 'पुतलीबजार', type: 'Municipality', totalWards: 14, popularToles: ['Putalibazar', 'Bhatkhola'] },
          { name: 'Waling Municipality', nameNp: 'वालिङ', type: 'Municipality', totalWards: 14, popularToles: ['Waling Bazar', 'Rambachha'] },
        ],
      },
      { name: 'Gorkha', nameNp: 'गोरखा', municipalities: [{ name: 'Gorkha Municipality', nameNp: 'गोरखा', type: 'Municipality', totalWards: 14, popularToles: ['Gorkha Bazar', 'Haramtari', 'Shakti Chowk'] }] },
      { name: 'Lamjung', nameNp: 'लमजुङ', municipalities: [{ name: 'Besisahar Municipality', nameNp: 'बेसीशहर', type: 'Municipality', totalWards: 11, popularToles: ['Besisahar Bazar', 'Shera'] }] },
      { name: 'Baglung', nameNp: 'बागलुङ', municipalities: [{ name: 'Baglung Municipality', nameNp: 'बागलुङ', type: 'Municipality', totalWards: 14, popularToles: ['Traffic Chowk', 'Lalbari', 'Kalika Mandir area'] }] },
      { name: 'Parbat', nameNp: 'पर्वत', municipalities: [{ name: 'Kushma Municipality', nameNp: 'कुश्मा', type: 'Municipality', totalWards: 14, popularToles: ['Kushma Bazar', 'Suspension Bridge area'] }] },
    ],
  },
  {
    id: 'lumbini',
    name: 'Lumbini Province',
    nameNp: 'लुम्बिनी प्रदेश',
    districts: [
      {
        name: 'Rupandehi',
        nameNp: 'रुपन्देही',
        municipalities: [
          {
            name: 'Butwal Sub-Metropolitan',
            nameNp: 'बुटवल उपमहानगरपालिका',
            type: 'Sub-Metropolitan',
            totalWards: 19,
            popularToles: [
              'Traffic Chowk',
              'Golpark',
              'Milanchowk',
              'Kalikanagar',
              'Devinagar',
              'Rajmarga Chowk',
              'Chauraha',
              'Deepnagar',
              'Hospital Line',
              'Tamnagar',
            ],
          },
          {
            name: 'Siddharthanagar Municipality',
            nameNp: 'सिद्धार्थनगर (भैरहवा)',
            type: 'Municipality',
            totalWards: 13,
            popularToles: ['Bank Road', 'Maitripath', 'Devkota Chowk', 'Airport Gate', 'Buspark Area', 'Anchalpur'],
          },
          {
            name: 'Tilottama Municipality',
            nameNp: 'तिलोत्तमा नगरपालिका',
            type: 'Municipality',
            totalWards: 17,
            popularToles: ['Manigram', 'Drivertole', 'Bhalwari', 'Kankali Chowk', 'Kotihawa'],
          },
          { name: 'Sainamaina Municipality', nameNp: 'सैनामैना', type: 'Municipality', totalWards: 11, popularToles: ['Murgiya Bazar', 'Saljhandi'] },
        ],
      },
      {
        name: 'Banke',
        nameNp: 'बाँके',
        municipalities: [
          {
            name: 'Nepalgunj Sub-Metropolitan',
            nameNp: 'नेपालगन्ज उपमहानगरपालिका',
            type: 'Sub-Metropolitan',
            totalWards: 23,
            popularToles: ['Dhamboji Chowk', 'Tribhuvan Chowk', 'Surkhet Road', 'Pushpalal Chowk', 'Ganeshpur', 'Bhairavsthan', 'Gharbaritole', 'Khajura Road'],
          },
          {
            name: 'Kohalpur Municipality',
            nameNp: 'कोहलपुर नगरपालिका',
            type: 'Municipality',
            totalWards: 15,
            popularToles: ['Kohalpur Chauraha', 'Medical College Area', 'Buspark', 'NCC Camp'],
          },
        ],
      },
      {
        name: 'Dang',
        nameNp: 'दाङ',
        municipalities: [
          {
            name: 'Ghorahi Sub-Metropolitan',
            nameNp: 'घोराही उपमहानगरपालिका',
            type: 'Sub-Metropolitan',
            totalWards: 19,
            popularToles: ['Traffic Chowk', 'Tulsi Chowk', 'Sahid Gate', 'Gulariya', 'Ghorahi Bazar'],
          },
          {
            name: 'Tulsipur Sub-Metropolitan',
            nameNp: 'तुलसीपुर उपमहानगरपालिका',
            type: 'Sub-Metropolitan',
            totalWards: 19,
            popularToles: ['Birendra Chowk', 'Araniko Chowk', 'Buspark', 'Airport Area'],
          },
        ],
      },
      { name: 'Kapilvastu', nameNp: 'कपिलवस्तु', municipalities: [{ name: 'Kapilvastu Municipality', nameNp: 'कपिलवस्तु (तौलिहवा)', type: 'Municipality', totalWards: 12, popularToles: ['Taulihawa Bazar'] }, { name: 'Banganga Municipality', nameNp: 'बाणगंगा (चारनम्बर)', type: 'Municipality', totalWards: 11, popularToles: ['Char Number Chowk', 'Pipra'] }] },
      { name: 'Palpa', nameNp: 'पाल्पा', municipalities: [{ name: 'Tansen Municipality', nameNp: 'तानसेन नगरपालिका', type: 'Municipality', totalWards: 14, popularToles: ['Shitalpati', 'Buspark', 'Dhulikhel Road', 'Mission Hospital Area'] }] },
      { name: 'Nawalparasi West', nameNp: 'नवलपरासी पश्चिम', municipalities: [{ name: 'Ramgram Municipality', nameNp: 'रामग्राम (परासी)', type: 'Municipality', totalWards: 18, popularToles: ['Parasi Bazar', 'Buddha Chowk'] }, { name: 'Sunwal Municipality', nameNp: 'सुनवल', type: 'Municipality', totalWards: 13, popularToles: ['Sunwal Chowk', 'Mahalaxmi'] }] },
    ],
  },
  {
    id: 'karnali',
    name: 'Karnali Province',
    nameNp: 'कर्णाली प्रदेश',
    districts: [
      {
        name: 'Surkhet',
        nameNp: 'सुर्खेत',
        municipalities: [
          {
            name: 'Birendranagar Municipality',
            nameNp: 'वीरेन्द्रनगर नगरपालिका',
            type: 'Municipality',
            totalWards: 16,
            popularToles: ['Mangalgarhi Chowk', 'Birendra Chowk', 'Jumla Road', 'Bulbule Area', 'Airport Line', 'Subhaghut', 'Dhuliyabit'],
          },
        ],
      },
      { name: 'Dailekh', nameNp: 'दैलेख', municipalities: [{ name: 'Narayan Municipality', nameNp: 'नारायण नगरपालिका', type: 'Municipality', totalWards: 11, popularToles: ['Dailekh Bazar'] }] },
      { name: 'Jumla', nameNp: 'जुम्ला', municipalities: [{ name: 'Chandannath Municipality', nameNp: 'चन्दननाथ नगरपालिका', type: 'Municipality', totalWards: 10, popularToles: ['Khalanga Bazar', 'Airport Area'] }] },
    ],
  },
  {
    id: 'sudurpashchim',
    name: 'Sudurpashchim Province',
    nameNp: 'सुदूरपश्चिम प्रदेश',
    districts: [
      {
        name: 'Kailali',
        nameNp: 'कैलाली',
        municipalities: [
          {
            name: 'Dhangadhi Sub-Metropolitan',
            nameNp: 'धनगढी उपमहानगरपालिका',
            type: 'Sub-Metropolitan',
            totalWards: 19,
            popularToles: ['Chauraha', 'Campus Road', 'Hasanpur', 'Traffic Chowk', 'Boradandi', 'Milan Chowk', 'Trikona', 'Trinagar Border'],
          },
          { name: 'Tikapur Municipality', nameNp: 'टीकापुर नगरपालिका', type: 'Municipality', totalWards: 9, popularToles: ['Tikapur Park Area', 'Block A', 'Block B'] },
          { name: 'Godawari Municipality', nameNp: 'गोदावरी (अत्तरिया)', type: 'Municipality', totalWards: 12, popularToles: ['Attariya Chowk', 'Buspark Area'] },
        ],
      },
      {
        name: 'Kanchanpur',
        nameNp: 'कञ्चनपुर',
        municipalities: [
          {
            name: 'Bhimdatta Municipality',
            nameNp: 'भीमदत्त (महेन्द्रनगर)',
            type: 'Municipality',
            totalWards: 19,
            popularToles: ['Mahendranagar Bazar', 'Traffic Chowk', 'Galli No. 1 to 5', 'Airport Road', 'Dodhara Chandani Link'],
          },
        ],
      },
      { name: 'Doti', nameNp: 'डोटी', municipalities: [{ name: 'Dipayal Silgadhi', nameNp: 'दिपायल सिलगढी', type: 'Municipality', totalWards: 9, popularToles: ['Silgadhi Bazar', 'Pipalla Bazar'] }] },
      { name: 'Dadeldhura', nameNp: 'डडेल्धुरा', municipalities: [{ name: 'Amargadhi Municipality', nameNp: 'अमरगढी', type: 'Municipality', totalWards: 11, popularToles: ['Bagbazar', 'Tufandanda'] }] },
    ],
  },
];

// Fuzzy finder to auto-match reverse geocoded names to hierarchy
export function matchProvince(query: string): ProvinceInfo | undefined {
  const q = query.toLowerCase();
  return NEPAL_LOCATION_HIERARCHY.find(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      q.includes(p.name.toLowerCase().replace(' province', '')) ||
      p.nameNp.includes(query) ||
      (q.includes('bagmati') && p.id === 'bagmati') ||
      (q.includes('koshi') && p.id === 'koshi') ||
      (q.includes('madhesh') && p.id === 'madhesh') ||
      (q.includes('gandaki') && p.id === 'gandaki') ||
      (q.includes('lumbini') && p.id === 'lumbini') ||
      (q.includes('karnali') && p.id === 'karnali') ||
      (q.includes('sudurpashchim') && p.id === 'sudurpashchim')
  );
}

export function matchDistrict(province: ProvinceInfo, query: string): DistrictInfo | undefined {
  const q = query.toLowerCase();
  return province.districts.find(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      q.includes(d.name.toLowerCase()) ||
      d.nameNp.includes(query)
  );
}

export function matchMunicipality(district: DistrictInfo, query: string): MunicipalityInfo | undefined {
  const q = query.toLowerCase();
  return district.municipalities.find(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      q.includes(m.name.toLowerCase().replace(/ (metropolitan|sub-metropolitan|municipality|rural municipality)/i, '')) ||
      m.nameNp.includes(query)
  );
}
