import pandas as pd
import numpy as np
import sqlite3
import os

def generate_hospital_data(db_path, num_patients=1000):
    """
    Generates a localized SQLite database following the OMOP CDM structure.
    """
    print(f"Generating synthetic OMOP data for: {db_path}")
    conn = sqlite3.connect(db_path)
    
    # 1. Create OMOP PERSON Table
    # concept_id 8507 = Male, 8532 = Female
    persons = pd.DataFrame({
        'person_id': range(1, num_patients + 1),
        'gender_concept_id': np.random.choice([8507, 8532], num_patients),
        'year_of_birth': np.random.randint(1950, 2010, num_patients),
        'race_concept_id': [8527] * num_patients  # Simplified
    })
    persons.to_sql('person', conn, if_exists='replace', index=False)

    # 2. Create OMOP DRUG_EXPOSURE Table
    # concept_id 1125315 = Acetaminophen, 1112807 = Aspirin
    drugs = pd.DataFrame({
        'drug_exposure_id': range(1, num_patients + 1),
        'person_id': range(1, num_patients + 1),
        'drug_concept_id': np.random.choice([1125315, 1112807], num_patients),
        'drug_exposure_start_date': ['2023-01-01'] * num_patients
    })
    drugs.to_sql('drug_exposure', conn, if_exists='replace', index=False)

    # 3. Create OMOP CONDITION_OCCURRENCE (The Labels/Outcomes)
    # We simulate a "Side Effect" (concept 432867) more likely in older patients
    # to give the AI something to actually learn.
    conditions = []
    for i in range(1, num_patients + 1):
        age = 2026 - persons.iloc[i-1]['year_of_birth']
        prob = 0.05 + (0.01 * (age / 10)) # Risk increases with age
        if np.random.rand() < prob:
            conditions.append({
                'person_id': i,
                'condition_concept_id': 432867, # Acute Myocardial Infarction
                'condition_start_date': '2023-06-01'
            })
    
    pd.DataFrame(conditions).to_sql('condition_occurrence', conn, if_exists='replace', index=False)
    
    conn.close()
    print(f"Success: {db_path} is ready for Federated Learning.")

if __name__ == "__main__":
    # Create data for two separate hospital nodes
    os.makedirs('data', exist_ok=True)
    generate_hospital_data('data/hospital_alpha.db', num_patients=1200)
    generate_hospital_data('data/hospital_beta.db', num_patients=800)
