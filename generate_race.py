import os
import sys
import json
import urllib.request
import pandas as pd
import bar_chart_race as bcr

# Supabase Credentials (default to the project credentials)
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://vrkvqxlzuaxupfxwajzr.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'sb_publishable_8vkn-jVX6VlurrUAAIXYhA_Bul-IYCM')

def fetch_supabase(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url)
    req.add_header('apikey', SUPABASE_KEY)
    req.add_header('Authorization', f"Bearer {SUPABASE_KEY}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Erro ao buscar dados do Supabase em {endpoint}: {e}")
        sys.exit(1)

def main():
    print("Conectando ao Supabase e buscando dados...")
    
    # 1. Fetch data from Supabase
    challenges = fetch_supabase("challenges?select=*")
    participants = fetch_supabase("participants?select=*")
    activities = fetch_supabase("activities?select=*&status=eq.approved")
    
    if not challenges:
        print("Nenhum desafio encontrado.")
        return
        
    # Find active challenge, or the most recent one
    active_challenge = next((c for c in challenges if c['status'] == 'active'), None)
    if not active_challenge:
        # Sort by created_at desc
        active_challenge = sorted(challenges, key=lambda c: c['created_at'], reverse=True)[0]
        
    print(f"\nDesafio selecionado: {active_challenge['name']}")
    
    # Map participant IDs to names
    p_map = {p['id']: p['name'] for p in participants}
    
    # Filter activities for this challenge
    ch_activities = [a for a in activities if a['challenge_id'] == active_challenge['id']]
    
    if not ch_activities:
        print("Nenhuma atividade aprovada encontrada para este desafio.")
        return
        
    # Get active activity types
    types_found = set(a['type'] for a in ch_activities)
    
    # Date processing setup
    start_date = pd.to_datetime(active_challenge['start_date'])
    end_date = pd.to_datetime(active_challenge['end_date'])
    today = pd.to_datetime(pd.Timestamp.now().date())
    
    # Cap date at today if challenge is active and end date is in the future
    if active_challenge['status'] == 'active' and today < end_date:
        end_date = today
        
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    print(f"Período de corrida: {start_date.strftime('%d/%m/%Y')} a {end_date.strftime('%d/%m/%Y')} ({len(date_range)} dias)")
    
    for act_type in types_found:
        type_activities = [a for a in ch_activities if a['type'] == act_type]
        if not type_activities:
            continue
            
        print(f"\n--- Processando corrida para: {act_type.upper()} ---")
        
        # 2. Build cumulative time-series data
        # Create empty dataframe with columns as participant names
        df_data = {p['name']: [0.0] * len(date_range) for p in participants}
        df = pd.DataFrame(df_data, index=date_range)
        
        # Aggregate daily amounts
        for act in type_activities:
            date_idx = pd.to_datetime(act['date'])
            p_name = p_map.get(act['participant_id'])
            if p_name and date_idx in df.index:
                df.loc[date_idx, p_name] += float(act['amount'])
                
        # Make cumulative sum over days
        df_cumulative = df.cumsum()
        
        # 3. Generate bar chart race
        output_filename = f"bar_chart_race_{act_type}.mp4"
        
        title = f"Corrida de {act_type.capitalize()} - {active_challenge['name']}"
        if act_type == 'pushup':
            title = f"Corrida de Flexões - {active_challenge['name']}"
        elif act_type == 'running':
            title = f"Corrida de Corrida (km) - {active_challenge['name']}"
        elif act_type == 'cycling':
            title = f"Corrida de Bike (km) - {active_challenge['name']}"
            
        print(f"Escrevendo arquivo: {output_filename}...")
        
        try:
            bcr.bar_chart_race(
                df=df_cumulative,
                filename=output_filename,
                orientation='h',
                sort='desc',
                n_bars=min(10, len(participants)),
                fixed_order=False,
                fixed_max=True,
                steps_per_period=10,
                period_length=500,
                interpolate_period=False,
                title=title,
                bar_label_font=8,
                tick_label_font=8,
                base_period_length=500
            )
            print(f"Vídeo de {act_type} gerado com sucesso em '{output_filename}'!")
        except Exception as e:
            print(f"Erro ao gerar Bar Chart Race para {act_type}: {e}")
            print("\nNOTA: Certifique-se de que possui as bibliotecas 'pandas', 'bar_chart_race', 'matplotlib' instaladas.")
            print("Também é necessário ter o 'FFmpeg' instalado no computador e adicionado ao PATH do sistema para salvar arquivos de vídeo .mp4.")

if __name__ == "__main__":
    main()
