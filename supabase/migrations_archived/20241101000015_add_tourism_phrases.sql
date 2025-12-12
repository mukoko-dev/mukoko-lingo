-- Add tourism and travel-focused phrases to the database
-- These phrases are essential for travelers visiting Zimbabwe and engaging with locals

INSERT INTO phrases (category, english, shona, ndebele, chinese, english_pronunciation, shona_pronunciation, ndebele_pronunciation, chinese_pronunciation, english_context, shona_context, ndebele_context, chinese_context) VALUES

-- Tourism category
('tourism', 'Where is the Victoria Falls?', 'Mabhokisi eVictoria Falls ari kupi?', 'IVictoria Falls isephi?', '维多利亚瀑布在哪里？', 'wair iz thuh vik-tor-ee-uh fawlz', 'ma-bo-ki-si e-vik-to-ri-a folz a-ri ku-pi', 'i-vik-to-ri-a folz i-se-pi', 'wéi duō lì yà pù bù zài nǎ lǐ', 'Asking for directions to major tourist attraction', 'Kubvunza nzira kuenda kunzvimbo yekushanyira', 'Ukubuza indlela eya endaweni yezivakashi', '询问主要旅游景点的方向'),

('tourism', 'Can I take a photo here?', 'Ndingatore mufananidzo pano here?', 'Ngingathatha isithombe lapha na?', '我可以在这里拍照吗？', 'kan eye tayk uh foh-toh heer', 'ndi-nga-to-re mu-fa-na-ni-dzo pa-no he-re', 'ngi-nga-tha-tha i-si-thom-be la-pha na', 'wǒ kě yǐ zài zhè lǐ pāi zhào ma', 'Asking permission to photograph', 'Kukumbira mvumo yekutora mufananidzo', 'Ukucela imvumo yokuthatha isithombe', '请求拍照许可'),

('tourism', 'How much is the entrance fee?', 'Mari yekupinda ingani?', 'Yimalini imali yokungena?', '门票多少钱？', 'how much iz thuh en-truns fee', 'ma-ri ye-ku-pin-da i-nga-ni', 'yi-ma-li-ni i-ma-li yo-ku-nge-na', 'mén piào duō shǎo qián', 'Asking about tourist site costs', 'Kubvunza nezvemari yekupinda munzvimbo yekushanyira', 'Ukubuza ngemali yokungena endaweni yezivakashi', '询问旅游景点费用'),

('tourism', 'Do you have a map?', 'Une mepu here?', 'Ulomdwebo yezindawo na?', '你有地图吗？', 'doo yoo hav uh map', 'u-ne me-pu he-re', 'u-lom-dwe-bo ye-zin-da-wo na', 'nǐ yǒu dì tú ma', 'Requesting navigation assistance', 'Kukumbira rubatsiro rwekufambisa', 'Ukucela usizo lokuqondisa', '请求导航帮助'),

('tourism', 'I am a tourist', 'Ndiri mushanyi', 'Ngingumvakashi', '我是游客', 'eye am uh toor-ist', 'ndi-ri mu-sha-nyi', 'ngi-ngu-mva-ka-shi', 'wǒ shì yóu kè', 'Identifying yourself as a visitor', 'Kuzivisa kuti uri mushanyi', 'Ukuzivisa ukuthi ungumvakashi', '表明你是游客'),

('tourism', 'Where can I buy souvenirs?', 'Ndingatenga zviyeuchidzo kupi?', 'Ngingathenga izikhumbuzo kuphi?', '我可以在哪里买纪念品？', 'wair kan eye buy soo-vuh-neerz', 'ndi-nga-te-nga zvi-yeu-chi-dzo ku-pi', 'ngi-nga-the-nga i-zi-khum-bu-zo ku-phi', 'wǒ kě yǐ zài nǎ lǐ mǎi jì niàn pǐn', 'Looking for gift shops', 'Kutsvaga zvitoro zvezvipo', 'Ukufuna izitolo zezipho', '寻找礼品店'),

('tourism', 'Can you recommend a good restaurant?', 'Ungandikurudzira restorendi yakanaka here?', 'Ungangincoma indawo yokudlela enhle na?', '你能推荐一家好餐厅吗？', 'kan yoo rek-uh-mend uh good res-tuh-ront', 'u-nga-ndi-ku-ru-dzi-ra res-to-ren-di ya-ka-na-ka he-re', 'u-nga-ngi-nco-ma in-da-wo yo-ku-dle-la e-nhle na', 'nǐ néng tuī jiàn yī jiā hǎo cān tīng ma', 'Asking for dining suggestions', 'Kubvunza nezvenzvimbo dzekudyira', 'Ukubuza ngezindawo zokudlela', '询问餐饮建议'),

('tourism', 'Is it safe to walk here at night?', 'Zvakachengeteka kufamba pano usiku here?', 'Kuphephile ukuhamba lapha ebusuku na?', '晚上在这里走路安全吗？', 'iz it sayf too wawk heer at nite', 'zva-ka-che-nge-te-ka ku-fam-ba pa-no u-si-ku he-re', 'ku-phe-phi-le u-ku-ham-ba la-pha e-bu-su-ku na', 'wǎn shàng zài zhè lǐ zǒu lù ān quán ma', 'Inquiring about safety', 'Kubvunza nezvekuchengeteka', 'Ukubuza ngokuphepha', '询问安全问题'),

('tourism', 'Where is the nearest hotel?', 'Hotero iri pedyo iripi?', 'Ihhotela eliseduze lisephi?', '最近的酒店在哪里？', 'wair iz thuh neer-est hoh-tel', 'ho-te-ro i-ri pe-dyo i-ri-pi', 'i-hho-te-la e-li-se-du-ze li-se-phi', 'zuì jìn de jiǔ diàn zài nǎ lǐ', 'Finding accommodation', 'Kutsvaga pekugara', 'Ukufuna indawo yokuhlala', '寻找住宿'),

('tourism', 'Can I pay with credit card?', 'Ndingabhadhara nekadhikadhi here?', 'Ngingabhadala ngekhadi yesikolodo na?', '我可以用信用卡支付吗？', 'kan eye pay with kred-it kard', 'ndi-nga-bha-dha-ra ne-ka-dhi-ka-dhi he-re', 'ngi-nga-bha-da-la nge-kha-di ye-si-ko-lo-do na', 'wǒ kě yǐ yòng xìn yòng kǎ zhī fù ma', 'Payment method inquiry', 'Kubvunza nenzira yekubhadhara', 'Ukubuza ngendlela yokukhokha', '询问付款方式'),

-- Travel essentials
('tourism', 'I need a taxi to the airport', 'Ndiri kuda tekisi kuenda kumhepo', 'Ngidinga itekisi eya esikhaleni sendiza', '我需要一辆出租车去机场', 'eye need uh tak-see too thuh air-port', 'ndi-ri ku-da te-ki-si ku-en-da ku-mhe-po', 'ngi-di-nga i-te-ki-si e-ya e-si-kha-le-ni sen-di-za', 'wǒ xū yào yī liàng chū zū chē qù jī chǎng', 'Airport transportation request', 'Kukumbira chitima chekuenda kumhepo', 'Ukucela isithuthi sokuya esikhaleni', '请求机场交通'),

('tourism', 'What time does the museum open?', 'Muziyamu unovhurwa nguva yei?', 'Indlu yamagugu ivulwa nini?', '博物馆几点开门？', 'wut time duz thuh myoo-zee-um oh-pen', 'mu-zi-ya-mu u-no-vhu-rwa ngu-va yei', 'in-dlu ya-ma-gu-gu i-vul-wa ni-ni', 'bó wù guǎn jǐ diǎn kāi mén', 'Asking about operating hours', 'Kubvunza nguva yekuvhura', 'Ukubuza ngesikhathi sokuvula', '询问营业时间'),

('tourism', 'Can you speak English?', 'Unotaura Chirungu here?', 'Uyakhuluma isiNgisi na?', '你会说英语吗？', 'kan yoo speek ing-glish', 'u-no-tau-ra chi-ru-ngu he-re', 'u-ya-khu-lu-ma i-si-ngi-si na', 'nǐ huì shuō yīng yǔ ma', 'Language barrier communication', 'Kubvunza nezvemutauro', 'Ukubuza ngolimi', '语言障碍沟通'),

('tourism', 'I am lost, can you help me?', 'Ndarasika, mundibatsira here?', 'Ngilahlekile, uyangisiza na?', '我迷路了，你能帮我吗？', 'eye am lawst kan yoo help mee', 'nda-ra-si-ka mun-di-ba-tsi-ra he-re', 'ngi-la-hle-ki-le u-ya-ngi-si-za na', 'wǒ mí lù le nǐ néng bāng wǒ ma', 'Emergency assistance request', 'Kukumbira rubatsiro rwekukurumidzira', 'Ukucela usizo oluphuthumayo', '紧急求助请求'),

('tourism', 'This place is beautiful!', 'Nzvimbo ino yakanaka!', 'Indawo le iyinhle kakhulu!', '这个地方很美！', 'this plays iz byoo-tuh-ful', 'nzvi-mbo i-no ya-ka-na-ka', 'in-da-wo le i-yi-nhle ka-khu-lu', 'zhè ge dì fāng hěn měi', 'Expressing appreciation', 'Kuratidza kufadzwa', 'Ukuveza ukuthokoza', '表达欣赏');
