import os
import json
import urllib.request
import urllib.parse
import re
import subprocess

# Ensure scratch directory exists for caching
os.makedirs("scratch", exist_ok=True)

CMUDICT_PATH = "scratch/cmudict.dict"

def load_cmudict():
    """Loads or downloads CMU Pronouncing Dictionary to use as pronunciation helper."""
    if not os.path.exists(CMUDICT_PATH):
        print("Downloading CMU Pronouncing Dictionary for reference (approx. 3.5MB)...")
        try:
            req = urllib.request.Request(
                "https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict",
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req) as response:
                with open(CMUDICT_PATH, 'wb') as f:
                    f.write(response.read())
            print("CMU Dictionary downloaded successfully.")
        except Exception as e:
            print(f"Warning: Failed to download CMUDict: {e}")
            return {}
    
    cmudict = {}
    if os.path.exists(CMUDICT_PATH):
        try:
            with open(CMUDICT_PATH, 'r', encoding='latin-1') as f:
                for line in f:
                    parts = line.strip().split(' ', 1)
                    if len(parts) == 2:
                        w, pron = parts
                        # Clean word (remove duplicate suffixes like 'developer(1)')
                        w_clean = re.sub(r'\(\d+\)$', '', w).lower()
                        cmudict[w_clean] = pron.strip()
        except Exception as e:
            print(f"Warning: Failed to parse CMUDict: {e}")
    return cmudict

def search_wikimedia_commons(word):
    """Queries MediaWiki API to find audio recordings matching the word on Wikimedia Commons."""
    query = f"(LL-Q1860 OR en-us OR en-gb OR pronunciation) {word}"
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&srnamespace=6&format=json&origin=*"
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            search_results = res_data.get('query', {}).get('search', [])
            
            candidates = []
            for item in search_results:
                title = item.get('title', '')
                if title.startswith('File:'):
                    filename = title[5:]
                    # Filter for audio extensions
                    if filename.lower().endswith(('.ogg', '.wav', '.flac', '.oga', '.mp3')):
                        candidates.append(filename)
            return candidates
    except Exception as e:
        return []

def suggest_baseform(word):
    """Provides a simple rule-based suggestion for baseforms."""
    if word.endswith('s') and not word.endswith('ss'):
        if word.endswith('ies'):
            return word[:-3] + 'y'
        return word[:-1]
    if word.endswith('ed'):
        if word.endswith('ied'):
            return word[:-3] + 'y'
        return word[:-1]
    if word.endswith('ing'):
        return word[:-3]
    return word

def save_indented_json(path, data):
    """Saves a JSON file indented with tabs to match repository style."""
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent='\t', ensure_ascii=False)
        f.write('\n')

def save_minified_json(path, data):
    """Saves a minified JSON file to save space (used for audios mapping)."""
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)
        f.write('\n')

def find_best_audio_candidate(candidates, word, dialect='NAmE'):
    """Heuristically picks the best matching audio file for a given dialect."""
    if not candidates:
        return None
    term = word.lower()
    if dialect == 'NAmE':
        matches = [c for c in candidates if 'en-us' in c.lower() or 'us-' in c.lower() or 'genam' in c.lower()]
        if matches: return matches[0]
    else:
        matches = [c for c in candidates if 'en-gb' in c.lower() or 'en-uk' in c.lower() or 'vealhurl' in c.lower()]
        if matches: return matches[0]
    
    matches = [c for c in candidates if term in c.lower()]
    if matches:
        return matches[0]
    return candidates[0]

def get_git_diff_added_words(ref="HEAD"):
    """Runs git diff to find newly added words in the pronunciation and baseforms files."""
    added_words = set()
    files_to_check = [
        "chrome-extension/public/en-baseforms.json",
        "chrome-extension/public/en-NAmE-pronunciation.txt",
        "chrome-extension/public/en-BrE-pronunciation.txt"
    ]
    for file_path in files_to_check:
        try:
            cmd = ["git", "diff", ref, "--", file_path]
            res = subprocess.run(
                cmd,
                capture_output=True, text=True, check=True
            )
            for line in res.stdout.splitlines():
                if line.startswith("+") and not line.startswith("+++"):
                    # Extract the JSON key, e.g. +	"sarcastic": "...",
                    match = re.search(r'^\+\s*"([^"]+)"', line)
                    if match:
                        added_words.add(match.group(1).lower())
        except Exception:
            pass
    return sorted(list(added_words))

def select_and_confirm_audio(word, dialect, candidates, current_audio, audio_dict, audio_path):
    """Interactive helper to select and confirm audio choice from list or custom input."""
    best_candidate = find_best_audio_candidate(candidates, word, dialect)
    if not best_candidate:
        print(f"     No matching audio recordings found on Wikimedia Commons for '{word}'.")
        manual = input(f"     Enter custom audio filename [default: keep current {repr(current_audio)}]: ").strip()
        if manual:
            audio_dict[word] = manual
            save_minified_json(audio_path, audio_dict)
            print(f"     Added custom audio: {manual}")
        return
        
    print(f"     Found candidate on Commons: {best_candidate}")
    while True:
        choice = input(f"     Add to {dialect} audio? ([y] Yes, [n] No, [s] Show other choices, [q] Quit scanning): ").strip().lower()
        if choice in ('y', 'yes', ''):
            audio_dict[word] = best_candidate
            save_minified_json(audio_path, audio_dict)
            print(f"     Added audio: {best_candidate}")
            break
        elif choice in ('n', 'no'):
            print("     Skipped audio mapping.")
            break
        elif choice in ('q', 'quit'):
            return "QUIT"
        elif choice in ('s', 'show'):
            print("     Other options found:")
            for idx, filename in enumerate(candidates, 1):
                print(f"       [{idx}] {filename}")
            custom = input("     Select number, type custom filename, or enter to cancel: ").strip()
            if custom:
                if custom.isdigit() and 1 <= int(custom) <= len(candidates):
                    best_candidate = candidates[int(custom) - 1]
                else:
                    best_candidate = custom
                print(f"     Updated Proposed Audio File: {best_candidate}")

def run_git_diff_scan(baseforms, name_pron, bre_pron, name_aud, bre_aud, cmu,
                      baseforms_path, name_pron_path, bre_pron_path, name_aud_path, bre_aud_path):
    """Option 1: Scans Git history for newly added words and offers to sync pronunciations and find audios."""
    print("\n--- Scanning Git Diff for Newly Added Words (Penambahan Baru dari Git) ---")
    
    added_words = get_git_diff_added_words("HEAD")
    diff_source = "working tree (uncommitted changes)"
    
    if not added_words:
        print("No added words found in current uncommitted changes. Checking last commit (HEAD~1)...")
        added_words = get_git_diff_added_words("HEAD~1")
        diff_source = "last commit (HEAD~1)"
        
    if not added_words:
        print("No added words found in last commit. Checking against origin/main...")
        added_words = get_git_diff_added_words("origin/main")
        diff_source = "changes since origin/main"
        
    if not added_words:
        ref = input("No changes detected. Enter custom Git ref/branch to compare against (e.g. 'main', or press Enter to skip): ").strip()
        if ref:
            added_words = get_git_diff_added_words(ref)
            diff_source = f"changes since {ref}"
            
    if not added_words:
        print("No newly added words could be detected in Git history.")
        return
        
    print(f"Detected {len(added_words)} newly added words from {diff_source}:")
    print(", ".join(added_words[:20]) + ("..." if len(added_words) > 20 else ""))
    
    processed = 0
    for word in added_words:
        print(f"\n[Added Word] '{word}'")
        
        # Check pronunciation presence
        in_name = word in name_pron
        in_bre = word in bre_pron
        
        # 1. Sync pronunciations
        if in_name and not in_bre:
            src_pron = name_pron[word]
            print(f"  -> Missing in British (BrE). American pronunciation is '{src_pron}'")
            user_choice = input(f"     Add to British (BrE)? ([y] Yes, [e] Edit, [n] Skip): ").strip().lower()
            if user_choice in ('y', 'yes', ''):
                bre_pron[word] = src_pron
                save_indented_json(bre_pron_path, bre_pron)
                print(f"     Added to British (BrE).")
                in_bre = True
            elif user_choice in ('e', 'edit'):
                custom_p = input(f"     Enter British (BrE) pronunciation: ").strip().upper()
                if custom_p:
                    bre_pron[word] = custom_p
                    save_indented_json(bre_pron_path, bre_pron)
                    print(f"     Added to British (BrE).")
                    in_bre = True
                    
        elif in_bre and not in_name:
            src_pron = bre_pron[word]
            print(f"  -> Missing in American (NAmE). British pronunciation is '{src_pron}'")
            user_choice = input(f"     Add to American (NAmE)? ([y] Yes, [e] Edit, [n] Skip): ").strip().lower()
            if user_choice in ('y', 'yes', ''):
                name_pron[word] = src_pron
                save_indented_json(name_pron_path, name_pron)
                print(f"     Added to American (NAmE).")
                in_name = True
            elif user_choice in ('e', 'edit'):
                custom_p = input(f"     Enter American (NAmE) pronunciation: ").strip().upper()
                if custom_p:
                    name_pron[word] = custom_p
                    save_indented_json(name_pron_path, name_pron)
                    print(f"     Added to American (NAmE).")
                    in_name = True
                    
        elif not in_name and not in_bre:
            print(f"  -> Missing pronunciation in both NAmE and BrE.")
            default_p = cmu.get(word, "")
            user_choice = input(f"     Add pronunciation? (default: '{default_p}') [y/N]: ").strip().lower()
            if user_choice in ('y', 'yes'):
                p_input = input(f"     Enter NAmE pronunciation [default: {default_p}]: ").strip().upper()
                final_p = p_input if p_input else default_p
                if final_p:
                    name_pron[word] = final_p
                    bre_pron[word] = final_p
                    save_indented_json(name_pron_path, name_pron)
                    save_indented_json(bre_pron_path, bre_pron)
                    print("     Added pronunciation to both dialects.")
                    in_name = in_bre = True
        
        # 2. Audio/Voice Search & Mappings
        if in_name and word not in name_aud:
            print(f"  -> Missing American (NAmE) audio.")
            candidates = search_wikimedia_commons(word)
            res = select_and_confirm_audio(word, 'NAmE', candidates, name_aud.get(word), name_aud, name_aud_path)
            if res == "QUIT":
                break
                
        if in_bre and word not in bre_aud:
            print(f"  -> Missing British (BrE) audio.")
            candidates = search_wikimedia_commons(word)
            res = select_and_confirm_audio(word, 'BrE', candidates, bre_aud.get(word), bre_aud, bre_aud_path)
            if res == "QUIT":
                break
                
        processed += 1
        
    print(f"\nFinished processing {processed} added words.")

def run_voice_mapping_scan(name_pron, bre_pron, name_aud, bre_aud, name_aud_path, bre_aud_path):
    """Option 2: Scans all pronunciation files for words missing audio mapping, searches Commons, and adds them."""
    print("\n--- Scanning for Missing Voice Mappings (Semua Penambahan Voice) ---")
    dialect_choice = input("Select dialect to scan ([1] American NAmE, [2] British BrE, [3] Both) [3]: ").strip()
    if not dialect_choice:
        dialect_choice = "3"
        
    limit_choice = input("How many matching voice files to find and confirm in this run? [10]: ").strip()
    limit = int(limit_choice) if limit_choice.isdigit() else 10
    
    name_words = [w for w in name_pron.keys() if re.match(r'^[a-zA-Z]+$', w)]
    bre_words = [w for w in bre_pron.keys() if re.match(r'^[a-zA-Z]+$', w)]
    
    target_tasks = []
    
    if dialect_choice in ("1", "3"):
        missing_name = [w for w in name_words if w not in name_aud]
        for w in missing_name:
            target_tasks.append((w, 'NAmE'))
            
    if dialect_choice in ("2", "3"):
        missing_bre = [w for w in bre_words if w not in bre_aud]
        for w in missing_bre:
            target_tasks.append((w, 'BrE'))
            
    if not target_tasks:
        print("No missing voice mappings found for clean alphabetic words!")
        return

    print(f"Found {len(target_tasks)} total missing voice mappings. Starting Wikimedia search...")
    
    found_count = 0
    skipped_words = set()
    
    for word, dialect in target_tasks:
        if found_count >= limit:
            break
        if word in skipped_words:
            continue
            
        candidates = search_wikimedia_commons(word)
        best_candidate = find_best_audio_candidate(candidates, word, dialect)
        
        if best_candidate:
            print(f"\n[Found Match] Word: '{word}' ({dialect})")
            print(f"  Proposed Audio File: {best_candidate}")
            
            while True:
                choice = input("Confirm addition? ([y] Yes, [n] No/Skip word, [s] Show other choices, [q] Quit scan): ").strip().lower()
                if choice in ('y', 'yes', ''):
                    if dialect == 'NAmE':
                        name_aud[word] = best_candidate
                        save_minified_json(name_aud_path, name_aud)
                    else:
                        bre_aud[word] = best_candidate
                        save_minified_json(bre_aud_path, bre_aud)
                    print(f"Added voice mapping for '{word}' to {dialect} audios.")
                    found_count += 1
                    break
                elif choice in ('n', 'no'):
                    print(f"Skipped word '{word}'.")
                    skipped_words.add(word)
                    break
                elif choice in ('s', 'show'):
                    print("Other options found:")
                    for idx, filename in enumerate(candidates, 1):
                        print(f"  [{idx}] {filename}")
                    custom = input("Select number, type custom filename, or enter to go back: ").strip()
                    if custom:
                        if custom.isdigit() and 1 <= int(custom) <= len(candidates):
                            best_candidate = candidates[int(custom) - 1]
                        else:
                            best_candidate = custom
                        print(f"Updated Proposed Audio File: {best_candidate}")
                elif choice in ('q', 'quit'):
                    print("Exiting voice mapping scan.")
                    return
        else:
            continue

    print(f"\nScan completed. Added {found_count} new voice mappings.")

def run_word_mismatch_scan(name_pron, bre_pron, name_pron_path, bre_pron_path):
    """Option 3: Compares American and British pronunciation dicts to identify and copy/confirm missing words."""
    print("\n--- Scanning for Word Mismatches between Dialects (Semua Penambahan Word) ---")
    print("[1] Find words in American (NAmE) that are missing in British (BrE)")
    print("[2] Find words in British (BrE) that are missing in American (NAmE)")
    choice = input("Select scan direction [1]: ").strip()
    if not choice:
        choice = "1"
        
    limit_choice = input("How many words to process and confirm in this run? [10]: ").strip()
    limit = int(limit_choice) if limit_choice.isdigit() else 10
    
    name_words = set(w for w in name_pron.keys() if re.match(r'^[a-zA-Z]+$', w))
    bre_words = set(w for w in bre_pron.keys() if re.match(r'^[a-zA-Z]+$', w))
    
    if choice == "1":
        source_dict = name_pron
        target_dict = bre_pron
        target_path = bre_pron_path
        missing = sorted(list(name_words - bre_words))
        src_lang, tgt_lang = "American (NAmE)", "British (BrE)"
    else:
        source_dict = bre_pron
        target_dict = name_pron
        target_path = name_pron_path
        missing = sorted(list(bre_words - name_words))
        src_lang, tgt_lang = "British (BrE)", "American (NAmE)"
        
    if not missing:
        print(f"All clean words in {src_lang} are already present in {tgt_lang}!")
        return
        
    print(f"Found {len(missing)} words in {src_lang} that are missing in {tgt_lang}.")
    
    processed = 0
    for word in missing:
        if processed >= limit:
            break
            
        src_pron = source_dict[word]
        print(f"\n[Missing Word] '{word}'")
        print(f"  Source Pronunciation ({src_lang}): '{src_pron}'")
        
        user_input = input(f"Add to {tgt_lang}? ([y] Yes, [e] Edit pronunciation, [n] Skip, [q] Quit): ").strip().lower()
        if user_input in ('y', 'yes', ''):
            target_dict[word] = src_pron
            save_indented_json(target_path, target_dict)
            print(f"Added '{word}' -> '{src_pron}' to {tgt_lang}.")
            processed += 1
        elif user_input in ('e', 'edit'):
            custom_p = input(f"Enter custom pronunciation for '{word}': ").strip().upper()
            if custom_p:
                target_dict[word] = custom_p
                save_indented_json(target_path, target_dict)
                print(f"Added '{word}' -> '{custom_p}' to {tgt_lang}.")
                processed += 1
        elif user_input in ('n', 'skip'):
            print("Skipped.")
        elif user_input in ('q', 'quit'):
            break

    print(f"\nScan completed. Added {processed} words to {tgt_lang}.")

def run_manual_word_addition(baseforms, name_pron, bre_pron, name_aud, bre_aud, cmu,
                             baseforms_path, name_pron_path, bre_pron_path, name_aud_path, bre_aud_path):
    """Option 4: Manually add or modify details for a single user-typed word."""
    word = input("\nEnter word to add or modify: ").strip().lower()
    if not word:
        return
        
    print(f"\nChecking current entry details for '{word}':")
    curr_base = baseforms.get(word)
    curr_name_p = name_pron.get(word)
    curr_bre_p = bre_pron.get(word)
    curr_name_a = name_aud.get(word)
    curr_bre_a = bre_aud.get(word)
    
    print(f" - Baseform: {repr(curr_base)}")
    print(f" - NAmE Pron: {repr(curr_name_p)}")
    print(f" - BrE Pron:  {repr(curr_bre_p)}")
    print(f" - NAmE Audio: {repr(curr_name_a)}")
    print(f" - BrE Audio:  {repr(curr_bre_a)}")
    
    proposed_changes = {}
    
    # 1. Baseform mapping
    is_inflected = input(f"\nIs '{word}' an inflected form (plural, past tense, etc.)? [y/N]: ").strip().lower()
    if is_inflected in ('y', 'yes'):
        default_base = suggest_baseform(word)
        base_input = input(f"Enter base form word [default: {default_base}]: ").strip().lower()
        final_base = base_input if base_input else default_base
        if final_base != curr_base:
            proposed_changes['baseforms'] = final_base
    elif curr_base:
        remove_base = input("Remove existing baseform mapping? [y/N]: ").strip().lower()
        if remove_base in ('y', 'yes'):
            proposed_changes['baseforms'] = None

    # 2. American (NAmE) Pronunciation
    default_name_p = curr_name_p or cmu.get(word, "")
    name_p_input = input(f"American (NAmE) pronunciation [default: {default_name_p}]: ").strip()
    final_name_p = (name_p_input if name_p_input else default_name_p).upper()
    if final_name_p and final_name_p != curr_name_p:
        proposed_changes['name_pron'] = final_name_p
    
    # 3. British (BrE) Pronunciation
    default_bre_p = curr_bre_p or final_name_p or cmu.get(word, "")
    bre_p_input = input(f"British (BrE) pronunciation [default: {default_bre_p}]: ").strip()
    final_bre_p = (bre_p_input if bre_p_input else default_bre_p).upper()
    if final_bre_p and final_bre_p != curr_bre_p:
        proposed_changes['bre_pron'] = final_bre_p
    
    # 4. Audio/Voice Search on Wikimedia
    name_audio_selection = curr_name_a
    bre_audio_selection = curr_bre_a
    
    search_choice = input("Search Wikimedia Commons for matching voice recordings? [Y/n]: ").strip().lower()
    if search_choice not in ('n', 'no'):
        candidates = search_wikimedia_commons(word)
        if candidates:
            print("\nMatches found:")
            for idx, filename in enumerate(candidates, 1):
                print(f"  [{idx}] {filename}")
            
            # American Audio
            print("\nSelect American (NAmE) Audio:")
            print("  - Enter a number to select from list")
            print("  - Or paste custom filename")
            print(f"  - Or press Enter to keep current: {repr(curr_name_a)}")
            name_a_choice = input("Choice: ").strip()
            if name_a_choice:
                if name_a_choice.isdigit() and 1 <= int(name_a_choice) <= len(candidates):
                    name_audio_selection = candidates[int(name_a_choice) - 1]
                else:
                    name_audio_selection = name_a_choice
            
            # British Audio
            print("\nSelect British (BrE) Audio:")
            print("  - Enter a number to select from list")
            print("  - Or paste custom filename")
            print(f"  - Or press Enter to keep current: {repr(curr_bre_a)}")
            bre_a_choice = input("Choice: ").strip()
            if bre_a_choice:
                if bre_a_choice.isdigit() and 1 <= int(bre_a_choice) <= len(candidates):
                    bre_audio_selection = candidates[int(bre_a_choice) - 1]
                else:
                    bre_audio_selection = bre_a_choice
        else:
            print("No direct matching recordings found on Wikimedia Commons.")
            manual_name_a = input(f"Enter custom American (NAmE) audio filename [default: {repr(curr_name_a)}]: ").strip()
            if manual_name_a:
                name_audio_selection = manual_name_a
            
            manual_bre_a = input(f"Enter custom British (BrE) audio filename [default: {repr(curr_bre_a)}]: ").strip()
            if manual_bre_a:
                bre_audio_selection = manual_bre_a
    
    if name_audio_selection != curr_name_a:
        proposed_changes['name_aud'] = name_audio_selection
    if bre_audio_selection != curr_bre_a:
        proposed_changes['bre_aud'] = bre_audio_selection

    # Display confirmation
    if not proposed_changes:
        print("\nNo changes proposed.")
        return
    
    print("\n==================================================")
    print(f"PROPOSED CHANGES FOR '{word}':")
    print("==================================================")
    if 'baseforms' in proposed_changes:
        val = proposed_changes['baseforms']
        print(f" * en-baseforms.json:        {repr(curr_base)} -> {repr(val)}")
    if 'name_pron' in proposed_changes:
        val = proposed_changes['name_pron']
        print(f" * en-NAmE-pronunciation.txt: {repr(curr_name_p)} -> {repr(val)}")
    if 'bre_pron' in proposed_changes:
        val = proposed_changes['bre_pron']
        print(f" * en-BrE-pronunciation.txt:  {repr(curr_bre_p)} -> {repr(val)}")
    if 'name_aud' in proposed_changes:
        val = proposed_changes['name_aud']
        print(f" * en-NAmE-audios.txt:        {repr(curr_name_a)} -> {repr(val)}")
    if 'bre_aud' in proposed_changes:
        val = proposed_changes['bre_aud']
        print(f" * en-BrE-audios.txt:         {repr(curr_bre_a)} -> {repr(val)}")
    print("==================================================")
    
    confirm = input("Apply these changes? (y/n) [y]: ").strip().lower()
    if confirm in ('', 'y', 'yes'):
        if 'baseforms' in proposed_changes:
            if proposed_changes['baseforms'] is None:
                baseforms.pop(word, None)
            else:
                baseforms[word] = proposed_changes['baseforms']
        if 'name_pron' in proposed_changes:
            name_pron[word] = proposed_changes['name_pron']
        if 'bre_pron' in proposed_changes:
            bre_pron[word] = proposed_changes['bre_pron']
        if 'name_aud' in proposed_changes:
            name_aud[word] = proposed_changes['name_aud']
        if 'bre_aud' in proposed_changes:
            bre_aud[word] = proposed_changes['bre_aud']
        
        # Save back to files
        print("Saving files...")
        if 'baseforms' in proposed_changes:
            save_indented_json(baseforms_path, baseforms)
        if 'name_pron' in proposed_changes:
            save_indented_json(name_pron_path, name_pron)
        if 'bre_pron' in proposed_changes:
            save_indented_json(bre_pron_path, bre_pron)
        if 'name_aud' in proposed_changes:
            save_minified_json(name_aud_path, name_aud)
        if 'bre_aud' in proposed_changes:
            save_minified_json(bre_aud_path, bre_aud)
        
        print("Changes successfully applied and saved!")
    else:
        print("Changes discarded.")

def main():
    # Setup paths
    baseforms_path = "chrome-extension/public/en-baseforms.json"
    name_pron_path = "chrome-extension/public/en-NAmE-pronunciation.txt"
    bre_pron_path = "chrome-extension/public/en-BrE-pronunciation.txt"
    name_aud_path = "chrome-extension/public/en-NAmE-audios.txt"
    bre_aud_path = "chrome-extension/public/en-BrE-audios.txt"
    
    # Load dictionaries
    print("Loading local dictionaries...")
    try:
        with open(baseforms_path, 'r', encoding='utf-8') as f:
            baseforms = json.load(f)
        with open(name_pron_path, 'r', encoding='utf-8') as f:
            name_pron = json.load(f)
        with open(bre_pron_path, 'r', encoding='utf-8') as f:
            bre_pron = json.load(f)
        with open(name_aud_path, 'r', encoding='utf-8') as f:
            name_aud = json.load(f)
        with open(bre_aud_path, 'r', encoding='utf-8') as f:
            bre_aud = json.load(f)
    except Exception as e:
        print(f"Error loading dictionary files: {e}")
        return

    # Load CMUDict reference helper
    cmu = load_cmudict()
    
    while True:
        try:
            print("\n==================================================")
            print("Lumen Pronounce Dictionary Manager")
            print("==================================================")
            print("[1] Scan Git Diff for Newly Added Words (Penambahan Baru dari Git)")
            print("[2] Scan for Missing Voice Mappings (Semua Penambahan Voice)")
            print("[3] Scan for Word Mismatches between Dialects (Semua Penambahan Word)")
            print("[4] Manually Add or Modify a Specific Word")
            print("[5] Exit")
            print("==================================================")
            
            choice = input("Select option [1-5]: ").strip()
            if choice == "1":
                run_git_diff_scan(baseforms, name_pron, bre_pron, name_aud, bre_aud, cmu,
                                  baseforms_path, name_pron_path, bre_pron_path, name_aud_path, bre_aud_path)
            elif choice == "2":
                run_voice_mapping_scan(name_pron, bre_pron, name_aud, bre_aud, name_aud_path, bre_aud_path)
            elif choice == "3":
                run_word_mismatch_scan(name_pron, bre_pron, name_pron_path, bre_pron_path)
            elif choice == "4":
                run_manual_word_addition(baseforms, name_pron, bre_pron, name_aud, bre_aud, cmu,
                                         baseforms_path, name_pron_path, bre_pron_path, name_aud_path, bre_aud_path)
            elif choice == "5" or choice.lower() == 'q':
                print("Exiting dictionary manager. Goodbye!")
                break
            else:
                print("Invalid choice. Please select 1, 2, 3, 4, or 5.")
        except KeyboardInterrupt:
            print("\nExiting dictionary manager. Goodbye!")
            break
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == '__main__':
    main()
