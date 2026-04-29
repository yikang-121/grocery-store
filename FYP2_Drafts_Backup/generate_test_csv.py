import csv
import random

def generate_csv(filename, num_records):
    categories = ['Fruits', 'Dairy', 'Bakery', 'Pantry', 'Meat', 'Vegetables', 'Beverages', 'Snacks']
    
    with open(filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['SKU', 'Name', 'Cost', 'Qty', 'Category'])
        
        for i in range(1, num_records + 1):
            sku = f"TEST-SKU-{i:04d}"
            name = f"Test Product {i}"
            cost = round(random.uniform(1.0, 50.0), 2)
            qty = random.randint(10, 200)
            category = random.choice(categories)
            writer.writerow([sku, name, cost, qty, category])
            
    print(f"Successfully generated {filename} with {num_records} records.")

if __name__ == "__main__":
    generate_csv('sample_upload_100.csv', 100)
    generate_csv('sample_upload_500.csv', 500)
