import random
import string
import datetime
import uuid
import argparse
import hashlib

def generate_filename():
    hex_id = uuid.uuid4().hex[:16].upper()
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    return f"dictionary-{hex_id}-{today}.txt"

def generate_common_passwords(num_passwords, output_file=None, md5=False):
    if output_file is None:
        base = generate_filename()
        output_file = base.replace(".txt", "-md5.txt") if md5 else base
        
    common_patterns = [
        lambda: ''.join(random.choices(string.ascii_lowercase, k=random.randint(4, 8))),
        lambda: ''.join(random.choices(string.ascii_letters, k=random.randint(6, 10))),
        lambda: ''.join(random.choices(string.digits, k=random.randint(4, 8))),
        lambda: ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(6, 12))),
        lambda: ''.join(random.choices(string.ascii_lowercase + string.digits, k=random.randint(6, 10))),
        lambda: ''.join(random.choices(string.ascii_letters + "!@#$%^&*", k=random.randint(6, 12)))
    ]

    print(f"Generating {num_passwords} passwords to file: {output_file}")
    with open(output_file, "w", encoding="utf-8") as file:
        for _ in range(num_passwords):
            password = random.choice(common_patterns)()
            if md5:
                h = hashlib.md5(password.encode("ascii")).hexdigest()
                file.write(h + "\n")
            else:
                file.write(password + "\n")
    
    print(f"Dictionary generation complete: {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--num", type=int, default=1000000)
    parser.add_argument("--md5", action="store_true")
    parser.add_argument("--out", type=str, default=None)
    args = parser.parse_args()
    generate_common_passwords(args.num, output_file=args.out, md5=args.md5)