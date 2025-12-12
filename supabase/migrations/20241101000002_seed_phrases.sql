-- Seed the database with initial phrases
-- Greetings (20 phrases)
insert into public.phrases (category, english, english_pronunciation, english_context, shona, shona_pronunciation, shona_context, ndebele, ndebele_pronunciation, ndebele_context, chinese, chinese_pronunciation, chinese_context) values
('greetings', 'Hello', 'heh-LOH', 'Standard greeting', 'Mhoro', 'mm-HO-ro', 'Kwaziso yakajairwa', 'Sawubona', 'sah-woo-BOH-nah', 'Ukubingelela okujwayelekile', '你好', 'nǐ hǎo', '标准问候'),
('greetings', 'Good morning', 'good MOR-ning', 'Morning greeting', 'Mangwanani', 'mahn-gwah-NAH-nee', 'Kwaziso mangwanani', 'Livukile', 'lee-voo-KEE-leh', 'Ukubingelela kwasekuseni', '早上好', 'zǎo shàng hǎo', '早上问候'),
('greetings', 'Good evening', 'good EEV-ning', 'Evening greeting', 'Manheru', 'mahn-HEH-roo', 'Kwaziso manheru', 'Lishonile', 'lee-shoh-NEE-leh', 'Ukubingelela kwakusihlwa', '晚上好', 'wǎn shàng hǎo', '晚上问候'),
('greetings', 'How are you?', 'how ar yoo', 'Asking about wellbeing', 'Wakadini?', 'wah-kah-DEE-nee', 'Kubvunza nezvekuva', 'Unjani?', 'oon-JAH-nee', 'Ukubuza ngempilo', '你好吗?', 'nǐ hǎo ma', '询问健康状况'),
('greetings', 'I am fine', 'eye am fine', 'Positive response', 'Ndiri bhoo', 'nn-DEE-ree boh', 'Mhinduro yakanaka', 'Ngiyaphila', 'ng-ee-yah-PEE-lah', 'Impendulo enhle', '我很好', 'wǒ hěn hǎo', '积极回应'),
('greetings', 'Goodbye', 'good-BYE', 'Parting greeting', 'Chisarai zvakanaka', 'chee-sah-RYE zvah-kah-NAH-kah', 'Kwaziso yekuenda', 'Hamba kahle', 'HAM-bah KAH-leh', 'Ukubingelela kokuhamba', '再见', 'zài jiàn', '告别问候'),
('greetings', 'Good night', 'good nite', 'Night farewell', 'Urara zvakanaka', 'oo-RAH-rah zvah-kah-NAH-kah', 'Kwaziso yehusiku', 'Lala kuhle', 'LAH-lah KOO-hleh', 'Ukubingelela kwebusuku', '晚安', 'wǎn ān', '晚间告别'),
('greetings', 'See you later', 'see yoo LAY-ter', 'Later meeting', 'Ndichazoona', 'nn-dee-chah-zoh-OH-nah', 'Kusangana gare gare', 'Ngizokubona', 'ng-ee-zoh-koo-BOH-nah', 'Ukubonana kamuva', '回头见', 'huí tóu jiàn', '稍后见面'),
('greetings', 'See you tomorrow', 'see yoo tuh-MAH-roh', 'Tomorrow meeting', 'Ndichazoona mangwana', 'nn-dee-chah-zoh-OH-nah mahn-GWAH-nah', 'Kusangana mangwana', 'Ngizokubona kusasa', 'ng-ee-zoh-koo-BOH-nah koo-SAH-sah', 'Ukubonana kusasa', '明天见', 'míng tiān jiàn', '明天见面'),
('greetings', 'Thank you', 'THANK yoo', 'Expressing gratitude', 'Maita basa', 'MY-tah BAH-sah', 'Kuvonga', 'Ngiyabonga', 'ng-ee-yah-BOHN-gah', 'Ukubonga', '谢谢', 'xiè xie', '表达感谢'),
('greetings', 'Thank you very much', 'THANK yoo VEH-ree much', 'Strong gratitude', 'Ndatenda chaizvo', 'nn-dah-TEHN-dah chai-ZVOH', 'Kuvonga zvakanyanya', 'Ngiyabonga kakhulu', 'ng-ee-yah-BOHN-gah kah-KOO-loo', 'Ukubonga kakhulu', '非常感谢', 'fēi cháng gǎn xiè', '深表感谢'),
('greetings', 'You are welcome', 'yoo ar WEL-kum', 'Response to thanks', 'Zvakanayka', 'zvah-kah-NAY-kah', 'Kupindura kuvonga', 'Kulungile', 'koo-loo-NGEE-leh', 'Ukuphendula ukubonga', '不客气', 'bù kè qì', '不用谢'),
('greetings', 'Sorry', 'SAH-ree', 'Apology', 'Ndine urombo', 'nn-DEE-neh oo-ROHM-boh', 'Kukumbira ruregerero', 'Ngiyaxolisa', 'ng-ee-yah-koh-LEE-sah', 'Ukuxolisa', '对不起', 'duì bù qǐ', '道歉'),
('greetings', 'I am very sorry', 'eye am VEH-ree SAH-ree', 'Strong apology', 'Ndineurombo chaizvo', 'nn-DEE-neh-oo-ROHM-boh chai-ZVOH', 'Kukumbira ruregerero zvakanyanya', 'Ngiyaxolisa kakhulu', 'ng-ee-yah-koh-LEE-sah kah-KOO-loo', 'Ukuxolisa kakhulu', '我很抱歉', 'wǒ hěn bào qiàn', '深表歉意'),
('greetings', 'No problem', 'noh PRAH-blum', 'Accepting apology', 'Hapana mhosva', 'hah-PAH-nah mm-HOHSH-vah', 'Kugamuchira ruregerero', 'Akunankinga', 'ah-koo-nahn-KEEN-gah', 'Ukwamukela isixoliso', '没问题', 'méi wèn tí', '没关系'),
('greetings', 'Please', 'pleez', 'Request for help', 'Ndapota', 'nn-dah-POH-tah', 'Kukumbira rubatsiro', 'Ngicela', 'ng-ee-SEH-lah', 'Ukucela usizo', '请', 'qǐng', '请求帮助'),
('greetings', 'Yes', 'yes', 'Agreement', 'Hongu', 'HOHN-goo', 'Kubvuma', 'Yebo', 'YEH-boh', 'Ukuvuma', '是', 'shì', '同意'),
('greetings', 'No', 'noh', 'Disagreement', 'Kwete', 'KWEH-teh', 'Kuramba', 'Cha', 'chah', 'Ukwala', '不', 'bù', '不同意'),
('greetings', 'Welcome', 'WEL-kum', 'Welcoming someone', 'Taurai henyu', 'tah-OO-rye HEH-nyoo', 'Kugamuchira munhu', 'Wamukelekile', 'wah-moo-keh-leh-KEE-leh', 'Ukwamukela umuntu', '欢迎', 'huān yíng', '欢迎某人'),
('greetings', 'Excuse me', 'ex-KYOOZ mee', 'Polite request', 'Pamusoroi', 'pah-moo-soh-ROY', 'Kukumbira mvumo', 'Uxolo', 'oo-KOH-loh', 'Ukucela imvume', '不好意思', 'bù hǎo yì si', '礼貌请求');

-- Family (20 phrases)
insert into public.phrases (category, english, english_pronunciation, english_context, shona, shona_pronunciation, shona_context, ndebele, ndebele_pronunciation, ndebele_context, chinese, chinese_pronunciation, chinese_context) values
('family', 'Father', 'FAH-ther', 'Male parent', 'Baba', 'BAH-bah', 'Mubereki wechirume', 'Ubaba', 'oo-BAH-bah', 'Umzali wesilisa', '父亲', 'fù qīn', '男性父母'),
('family', 'Mother', 'MUH-ther', 'Female parent', 'Amai', 'ah-MY', 'Mubereki wechikadzi', 'Umama', 'oo-MAH-mah', 'Umzali wesifazane', '母亲', 'mǔ qīn', '女性父母'),
('family', 'Brother', 'BRUH-ther', 'Male sibling', 'Mukoma/Munin''una', 'moo-KOH-mah/moo-nee-NOO-nah', 'Hama yechirume', 'Umfowethu', 'oom-foh-WEH-too', 'Umzalwane wesilisa', '兄弟', 'xiōng dì', '男性兄弟姐妹'),
('family', 'Sister', 'SIS-ter', 'Female sibling', 'Hanzvadzi', 'hahn-ZVAH-dzee', 'Hama yechikadzi', 'Udadewethu', 'oo-dah-deh-WEH-too', 'Umzalwane wesifazane', '姐妹', 'jiě mèi', '女性兄弟姐妹'),
('family', 'Son', 'sun', 'Male child', 'Mwanakomana', 'mwah-nah-koh-MAH-nah', 'Mwana wechirume', 'Indodana', 'een-doh-DAH-nah', 'Umntwana wesilisa', '儿子', 'ér zi', '男性子女'),
('family', 'Daughter', 'DAW-ter', 'Female child', 'Mwanasikana', 'mwah-nah-see-KAH-nah', 'Mwana wechikadzi', 'Indodakazi', 'een-doh-dah-KAH-zee', 'Umntwana wesifazane', '女儿', 'nǚ ér', '女性子女'),
('family', 'Grandfather', 'GRAND-fah-ther', 'Male grandparent', 'Sekuru', 'seh-KOO-roo', 'Mubereki webaba/amai', 'Ubabamkhulu', 'oo-bah-bahm-KOO-loo', 'Umzali womzali wesilisa', '祖父', 'zǔ fù', '男性祖父母'),
('family', 'Grandmother', 'GRAND-muh-ther', 'Female grandparent', 'Mbuya', 'mm-BOO-yah', 'Mubereki webhukadzi', 'Ugogo', 'oo-GOH-goh', 'Umzali womzali wesifazane', '祖母', 'zǔ mǔ', '女性祖父母'),
('family', 'Grandchild', 'GRAND-child', 'Child of child', 'Muzukuru', 'moo-zoo-KOO-roo', 'Mwana wemwana', 'Umzukulu', 'oom-zoo-KOO-loo', 'Umntwana womntwana', '孙子/孙女', 'sūn zi/sūn nǚ', '孙辈'),
('family', 'Uncle', 'UN-kul', 'Father''s brother', 'Babamunini/Babamukuru', 'bah-bah-moo-NEE-nee', 'Hama yababa', 'Umalume', 'oo-mah-LOO-meh', 'Umzalwane kayise', '叔叔/伯伯', 'shū shu/bó bo', '父亲的兄弟'),
('family', 'Aunt', 'ant', 'Father''s sister', 'Tete/Mainini', 'TEH-teh/my-NEE-nee', 'Hama yababa/amai', 'Ubabakazi', 'oo-bah-bah-KAH-zee', 'Umzalwane kayise', '姑姑/阿姨', 'gū gu/ā yí', '父亲的姐妹'),
('family', 'Nephew/Niece', 'NEH-fyoo/neece', 'Sibling''s child', 'Muzukuru', 'moo-zoo-KOO-roo', 'Mwana wehama', 'Umzawakho', 'oom-zah-WAH-koh', 'Umntwana womzalwane', '侄子/侄女', 'zhí zi/zhí nǚ', '兄弟姐妹的孩子'),
('family', 'Cousin', 'KUH-zun', 'Extended family', 'Muzukuru', 'moo-zoo-KOO-roo', 'Hama yepedyo', 'Umzala', 'oom-ZAH-lah', 'Isihlobo', '表兄弟/堂兄弟', 'biǎo xiōng dì', '远亲'),
('family', 'Husband', 'HUZ-band', 'Male spouse', 'Murume', 'moo-ROO-meh', 'Mumwe wechirume', 'Umyeni', 'oom-YEH-nee', 'Umlingani wesilisa', '丈夫', 'zhàng fu', '男性配偶'),
('family', 'Wife', 'wife', 'Female spouse', 'Mudzimai', 'moo-DZEE-my', 'Mumwe wechikadzi', 'Umkami', 'oom-KAH-mee', 'Umlingani wesifazane', '妻子', 'qī zi', '女性配偶'),
('family', 'Father-in-law', 'FAH-ther in law', 'Spouse''s father', 'Tezvara', 'teh-ZVAH-rah', 'Baba vemumwe', 'Ukhwenyana', 'oo-KWEN-yah-nah', 'Uyise womlingani', '岳父/公公', 'yuè fù/gōng gong', '配偶的父亲'),
('family', 'Mother-in-law', 'MUH-ther in law', 'Spouse''s mother', 'Vamwene', 'vah-MWEH-neh', 'Amai vemumwe', 'Ukhwekazi', 'oo-KWEH-kah-zee', 'Unina womlingani', '岳母/婆婆', 'yuè mǔ/pó po', '配偶的母亲'),
('family', 'Child', 'child', 'Young person', 'Mwana', 'MWAH-nah', 'Munhu muduku', 'Umntwana', 'oom-nt-WAH-nah', 'Umuntu omncane', '孩子', 'hái zi', '年轻人'),
('family', 'Children', 'CHIL-dren', 'Multiple offspring', 'Vana', 'VAH-nah', 'Vanhu vaduku', 'Abantwana', 'ah-bahnt-WAH-nah', 'Abantu abancane', '孩子们', 'hái zi men', '多个后代'),
('family', 'Family', 'FAM-i-lee', 'Household group', 'Mhuri', 'mm-HOO-ree', 'Boka remhuri', 'Umndeni', 'oom-nn-DEH-nee', 'Iqembu lomndeni', '家庭', 'jiā tíng', '家庭群体');

-- Note: Due to size constraints, I'm showing the pattern. The full seed script would include all 100+ phrases across all categories (shopping, food, directions, work, home, social)
