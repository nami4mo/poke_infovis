from bs4 import BeautifulSoup
import sqlite3

def scrape_html(poke_id, poke_html):
    soup = BeautifulSoup(poke_html,'lxml')

    # 名前 - poke_name
    title_a = soup.find('a',id='title')
    title_split = title_a.string.split()
    poke_name = title_split[0]
    print(poke_name)


    # 基本データ
    # 高さ - height
    # 重さ - weight
    # タイプ1/タイプ2 - type1/type2
    table_basic = soup.find('table',summary='基本データ')
    tr_centers = table_basic.find_all('tr',class_='center')

    for tmp_tr in tr_centers:
        info_name_td = tmp_tr.find('td',class_='c1')
        if info_name_td is None:
            continue
        info_name = info_name_td.string
        if info_name == '高さ':
            height = tmp_tr.find_all('td')[1].string.rstrip('m')
            # print('高さ', height)
        if info_name == '重さ':
            weight = tmp_tr.find_all('td')[1].li.string.rstrip('kg')
            # print('高さ', weight)
        if info_name == 'タイプ':
            type_imgs = tmp_tr.find_all('img')
            type1 = type_imgs[0].get('alt')
            if len(type_imgs) > 1:
                type2 = type_imgs[1].get('alt')
            else:
                type2 = None


    # 詳細データ
    # 種族値 - base_stats[6]
    # 努力値 - effort_values[6]
    # タマゴ歩数 - egg_walk
    # タマゴグループ - egg_group1/egg_group2
    # 特性 - ability1/ability2
    # 夢特性 - hidden_ability
    table_detail = soup.find('table',summary='詳細データ')
    detail_trs = table_detail.find_all('tr')
    base_stats = [] # H,A,B,C,D,S
    effort_values = [] # H,A,B,C,D,S

    # 種族値
    for i in range(1,7):
        bs_point = detail_trs[i].find('td',class_='left').getText().strip()
        base_stats.append(bs_point)

    # 努力値
    if detail_trs[9].td.string == 'HP':
        for i in range(9,15):
            ev_point = detail_trs[i].find('td',class_='left').getText().strip()
            effort_values.append(ev_point)
    else:
        effort_values = [None,None,None,None,None,None]

    # タマゴ
    if len(detail_trs) > 20 and detail_trs[20].td.string == 'タマゴ歩数':
        egg_walk = detail_trs[20].find('td',class_='left').getText()
        # print(egg_walk)
        egg_groups_a = detail_trs[21].find_all('a')
        egg_group1 = egg_groups_a[0].string
        if len(egg_groups_a) > 1:
            egg_group2 = egg_groups_a[1].string
        else:
            egg_group2 = None
    else:
        egg_walk, egg_group1, egg_group2 = None, None, None

    # 特性
    if len(detail_trs) > 23:
        abilities = []
        hidden_ability = None
        for i in range(23, len(detail_trs)):
            if detail_trs[i].find('a') is None:
                continue
            ability = detail_trs[i].find('a').getText()
            if '*' in ability:
                hidden_ability = ability.lstrip('*')
            else:
                abilities.append(ability)
        ability1 = abilities[0]
        if len(abilities) > 1:
            ability2 = abilities[1]
        else:
             ability2 = None
        # print(abilities,hidden_ability)
    else:
        ability1, ability2, hidden_ability = None, None, None


    # 技 - all_moves
    table_move = soup.find('table',summary='技データ')
    all_moves = ''
    moves_a = table_move.find_all('a')
    for move_a in moves_a:
        move_name = move_a.string
        if move_a.get('class')  and 'moveDetailSwitch' in move_a.get('class'):
            continue
        if move_name == '遺伝経路':
            continue
        all_moves += (move_name + ':')
        print(move_name)
    all_moves = all_moves.rstrip(':')
    # print(all_moves)


    # 進化
    # 段階 - monster_evo_count
    # 最終進化の段階 - all_evo_count
    evo_list = soup.find('ul',class_='evo_list')
    monster_evo_count = 1
    all_evo_count = 1
    find_flag = False
    if evo_list:
        for li in evo_list.find_all('li'):
            if li.find('hr'):
                if find_flag:
                    break
                print('hr')
                monster_evo_count = 1
                all_evo_count = 1
            elif li.get('class') is not None and 'evo_arrow' in li.get('class'):
                all_evo_count += 1
            elif li.find('a').getText() == poke_name:
                monster_evo_count = all_evo_count
                find_flag = True

    # print(monster_evo_count,'/',all_evo_count)

    con.execute('''
        insert or replace into pokemons
        (id, name, height, weight,
        type1, type2, evolve, all_evolve,
        bs_h, bs_a, bs_b, bs_c, bs_d, bs_s,
        ev_h, ev_a, ev_b, ev_c, ev_d, ev_s,
        egg_walk, egg_group1, egg_group2,
        ability1, ability2, hidden_ability, moves)
        values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        '''
        ,(poke_id, poke_name, height, weight,
        type1, type2, monster_evo_count, all_evo_count,
        base_stats[0], base_stats[1], base_stats[2], base_stats[3], base_stats[4], base_stats[5],
        effort_values[0], effort_values[1], effort_values[2], effort_values[3], effort_values[4], effort_values[5],
        egg_walk, egg_group1, egg_group2,
        ability1, ability2, hidden_ability, all_moves)
    )
    con.commit()


if __name__ == '__main__':

    con = sqlite3.connect("pokemon.sqlite3",timeout=60.0)
    rows = con.execute('select id,html from monster_htmls limit 721 offset 0')


    for row in rows:
        print('----------')
        scrape_html(row[0],row[1])
