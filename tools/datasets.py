"""
鯖江市オープンデータカタログ（CKAN, organization: jp-fukui-sabae）から取得した
データセット定義。2026-08-14 に https://ckan.odp.jig.jp/api/3/action/package_search
?fq=organization:jp-fukui-sabae （582件）に対して実際に package_search を実行し、
パッケージID・リソースURL・ライセンスを確認したうえで書き起こしている。

想像でIDやURLを埋めていないこと（架空IDを作らない）を確認済み。
再取得する場合は tools/fetch_ckan.py を実行する。

ライセンスはいずれも CC-BY-2.1（クリエイティブ・コモンズ 表示 2.1 日本版）。
https://creativecommons.org/licenses/by/2.1/jp/
"""

LICENSE_CC_BY_21 = {
    "license": "CC-BY-2.1",
    "license_title": "クリエイティブ・コモンズ 表示 2.1",
    "license_url": "https://creativecommons.org/licenses/by/2.1/jp/",
    "organization": "福井県鯖江市",
}

# --- CSV / XLS データセット -------------------------------------------------

DATASETS = [
    {
        "key": "visitors_daily",
        "title": "【日別】令和７年度　西山公園東側来訪者数（人流データ）",
        "package_name": "18207_nishiyamakoenhigashigawanraihosyasu",
        "package_id": "5bb6a5ed-2529-4fb6-88e9-ff78c1badcd1",
        "resource_url": "https://ckan.odp.jig.jp/dataset/5bb6a5ed-2529-4fb6-88e9-ff78c1badcd1/resource/4a767e5c-f1aa-4199-9eaf-a4725532b8af/download/_-.csv",
        "format": "CSV",
        "encoding": "shift_jis",
        "raw_filename": "higashigawa_raiho.csv",
        **LICENSE_CC_BY_21,
    },
    {
        "key": "visitor_ratio_prefecture",
        "title": "【都道府県別割合】令和７年度　西山公園入場者（人流データ）",
        "package_name": "18207_nishiyamakoentodohukenbetsuwariai",
        "package_id": "d86c43f4-dca3-4e93-ae64-6cab60bd61b8",
        "resource_url": "https://ckan.odp.jig.jp/dataset/d86c43f4-dca3-4e93-ae64-6cab60bd61b8/resource/5793aebb-bd75-410b-9542-a3aee820d992/download/202604__.csv",
        "format": "CSV",
        "encoding": "shift_jis",
        "raw_filename": "todohuken_wariai.csv",
        # 注意: 2026-08-14 時点でこのリソースの実データはタイトルと一致しない。
        # 「嚮陽会館駐車場 出庫台数（日別）」2026年4月分と同一ファイル（バイト単位で一致、
        # ファイル名 202604__.csv・サイズ422byteが同一パッケージ
        # f2da00a6-5ba0-4b14-846a-b82161bc6736 のリソースと完全一致）。
        # 都道府県別割合データは市の登録ミスにより現状取得不能。convert_ratios.py は
        # このデータセットの変換をスキップし、警告を出す。
        "known_issue": "mislabeled_resource_parking_data_not_prefecture_ratio",
        **LICENSE_CC_BY_21,
    },
    {
        "key": "visitor_ratio_municipality",
        "title": "【市区町村別割合】令和７年度　西山公園入場者（人流データ）",
        "package_name": "18207_nishiyamakoenshikutyosonbetsuwariai",
        "package_id": "4ab39dd1-d25b-4948-b3c3-967b9eaea480",
        "resource_url": "https://ckan.odp.jig.jp/dataset/4ab39dd1-d25b-4948-b3c3-967b9eaea480/resource/1f7be246-362d-4877-babf-4a5f202161e1/download/_.csv",
        "format": "CSV",
        "encoding": "shift_jis",
        "raw_filename": "shikuchoson_wariai.csv",
        **LICENSE_CC_BY_21,
    },
    {
        "key": "tsutsuji_shurui_kabusu",
        "title": "西山公園のツツジ種類・株数",
        "package_name": "18207_nishiyamatsutsuji",
        "package_id": "a78580f3-b6c9-4495-8734-ef7c2dfbbbfe",
        "resource_url": "https://ckan.odp.jig.jp/dataset/a78580f3-b6c9-4495-8734-ef7c2dfbbbfe/resource/f2591a6a-5e6b-45d4-8356-7e537b8d309b/download/-.xls",
        "format": "XLS",
        "raw_filename": "tsutsuji_shurui_kabusu.xls",
        **LICENSE_CC_BY_21,
    },
    {
        "key": "visitors_monthly",
        "title": "西山公園入場者数(月別)",
        "package_name": "18207_nishiyamakoennyujoshasu",
        "package_id": "64081a92-440b-41f4-bc64-043996228588",
        "resource_url": "https://ckan.odp.jig.jp/dataset/64081a92-440b-41f4-bc64-043996228588/resource/db6fb48c-e275-44ea-96e4-70d3a5f60641/download/.xls",
        "format": "XLS",
        "raw_filename": "nyujoshasu_getsubetsu.xls",
        **LICENSE_CC_BY_21,
    },
]

# --- 画像データセット（シード用、7枚ずつ） -----------------------------------

IMAGE_DATASETS = [
    {
        "key": "tsutsuji_images",
        "title": "西山公園ツツジ画像",
        "package_name": "18207_nishiyamakoentsutsuzipicture",
        "package_id": "5485cc00-e0ff-4d75-b620-9402ed08a823",
        "subdir": "tsutsuji",
        "resources": [
            ("1.jpg", "https://ckan.odp.jig.jp/dataset/5485cc00-e0ff-4d75-b620-9402ed08a823/resource/4e2b5503-5405-4259-9bd4-21c399c3de7a/download/1.jpg"),
            ("2.jpg", "https://ckan.odp.jig.jp/dataset/5485cc00-e0ff-4d75-b620-9402ed08a823/resource/2f205454-50ec-4f2c-8b72-a8b893cca4d1/download/2.jpg"),
            ("3.jpg", "https://ckan.odp.jig.jp/dataset/5485cc00-e0ff-4d75-b620-9402ed08a823/resource/cc889b6f-9a41-4323-a62f-b87ae645a0d6/download/3.jpg"),
            ("4.jpg", "https://ckan.odp.jig.jp/dataset/5485cc00-e0ff-4d75-b620-9402ed08a823/resource/17d4f77c-d64e-43ae-9629-4f4274c6d3d0/download/4.jpg"),
            ("5.jpg", "https://ckan.odp.jig.jp/dataset/5485cc00-e0ff-4d75-b620-9402ed08a823/resource/6dffd68d-a115-4788-9cb0-23dd9c8caebb/download/5.jpg"),
            ("6.jpg", "https://ckan.odp.jig.jp/dataset/5485cc00-e0ff-4d75-b620-9402ed08a823/resource/addee061-8ec8-4bf9-a030-db538771e0e2/download/6.jpg"),
            ("7.jpg", "https://ckan.odp.jig.jp/dataset/5485cc00-e0ff-4d75-b620-9402ed08a823/resource/0947bf56-6366-40b1-b6fc-942d7d2d5a73/download/7.jpg"),
        ],
        **LICENSE_CC_BY_21,
    },
    {
        "key": "koyo_images",
        "title": "西山公園の紅葉画像",
        "package_name": "18207_nishiyamakoenkoyopicture",
        "package_id": "02c6e2d3-91b7-409e-b2af-0883d90cd842",
        "subdir": "koyo",
        "resources": [
            ("1.jpg", "https://ckan.odp.jig.jp/dataset/02c6e2d3-91b7-409e-b2af-0883d90cd842/resource/226ee460-2fa0-4407-8e5e-93b29898b75e/download/1.jpg"),
            ("2.jpg", "https://ckan.odp.jig.jp/dataset/02c6e2d3-91b7-409e-b2af-0883d90cd842/resource/6cad4bc7-e886-4a5c-a8c0-7c394abca5df/download/2.jpg"),
            ("3.jpg", "https://ckan.odp.jig.jp/dataset/02c6e2d3-91b7-409e-b2af-0883d90cd842/resource/dbae0189-012a-43c4-957f-096d426635cc/download/3.jpg"),
            ("4.jpg", "https://ckan.odp.jig.jp/dataset/02c6e2d3-91b7-409e-b2af-0883d90cd842/resource/fe9f64b6-b96b-466e-a598-5fe8aa65ccdb/download/4.jpg"),
            ("5.jpg", "https://ckan.odp.jig.jp/dataset/02c6e2d3-91b7-409e-b2af-0883d90cd842/resource/417a9662-b721-4786-9b08-ab2de302b9aa/download/5.jpg"),
            ("6.jpg", "https://ckan.odp.jig.jp/dataset/02c6e2d3-91b7-409e-b2af-0883d90cd842/resource/149149b0-301a-4123-8fab-5e6fa99754ea/download/6.jpg"),
            ("7.jpg", "https://ckan.odp.jig.jp/dataset/02c6e2d3-91b7-409e-b2af-0883d90cd842/resource/71dd19a9-ae16-4e90-9710-946d8ee4a05b/download/7.jpg"),
        ],
        **LICENSE_CC_BY_21,
    },
]
