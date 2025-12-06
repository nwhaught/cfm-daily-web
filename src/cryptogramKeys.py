import random

def generate_cryptogram_key():
    # Create list of uppercase letters A-Z
    letters = [chr(i) for i in range(65, 91)]

    # Create a new permutation where no letter is in its original position
    while True:
        shuffled = letters.copy()
        random.shuffle(shuffled)

        # Check if any letter is in its original position
        valid = True
        for i in range(26):
            if shuffled[i] == letters[i]:
                valid = False
                break

        if valid:
            return ''.join(shuffled)

# Generate and output 20 cryptogram keys
for i in range(20):
    key = generate_cryptogram_key()
    print(key);
