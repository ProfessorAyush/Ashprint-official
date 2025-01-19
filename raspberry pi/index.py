import tkinter as tk
from tkinter import messagebox
from pymongo import MongoClient
from PIL import Image, ImageTk
from threading import Thread
import time
import qrcode

# MongoDB Connection (Simulated for this example)
def connect_to_mongo():
    try:
        client = MongoClient('mongodb://localhost:27017/')  # MongoDB URI
        db = client['print_db']
        collection = db['PrintForm']
        collection.find_one()
        return True, client, db, collection
    except Exception as e:
        print(f"Connection failed: {e}")
        return False, None, None, None

# Generate a QR code pointing to a URL (can be modified with any URL)
def generate_qr_code(url):
    img = qrcode.make(url)
    img.save("qr.png")

# Function to simulate order fetching and printing
def process_order():
    # Simulating fetching data from database
    update_order_status("Fetching Data...")
    time.sleep(2)

    # Simulating printing
    update_order_status("Printing...")
    time.sleep(3)

    # Final printing completed
    update_order_status("Printing Complete. Please collect your print!")
    time.sleep(2)

    # Mark the order as printed (Simulated for now)
    update_order_status("Order Completed!")

# Update order status in the UI
def update_order_status(status):
    order_status_label.config(text=f"Current Status: {status}")
    progress_label.config(text=status)
    progress_label.update_idletasks()

# Function to start order processing in a separate thread
def start_order_processing():
    thread = Thread(target=process_order, daemon=True)
    thread.start()

# GUI Setup
root = tk.Tk()
root.title("Print Server")

# Full-Screen Window
root.attributes("-fullscreen", True)

# Colors and Fonts
bg_color = "#2A2A2A"  # Dark background
button_color = "#4CAF50"  # Green
header_color = "#FFFFFF"  # White for header text
label_color = "#FFFFFF"  # White for order labels

# Set window background color
root.configure(bg=bg_color)

# Generate QR code
url = "https://example.com"  # URL for QR code redirection
generate_qr_code(url)

# Load and display QR code image
qr_image = Image.open("qr.png")
qr_image = qr_image.resize((300, 300), Image.Resampling.LANCZOS)  # Updated resizing method
qr_tk_image = ImageTk.PhotoImage(qr_image)


qr_label = tk.Label(root, image=qr_tk_image, bg=bg_color)
qr_label.pack(pady=30)

# Header
header_label = tk.Label(root, text="Print Queue Dashboard", font=("Helvetica", 40, "bold"), fg=header_color, bg=bg_color)
header_label.pack(pady=30)

# Current order status label
order_status_label = tk.Label(root, text="Current Status: Waiting for Orders", font=("Helvetica", 22), fg=label_color, bg=bg_color)
order_status_label.pack(pady=20)

# Progress label
progress_label = tk.Label(root, text="Fetching Data...", font=("Helvetica", 18), fg="#FFEB3B", bg=bg_color)
progress_label.pack(pady=20)

# Start order processing button (simulated as it will auto start)
start_button = tk.Button(root, text="Start Processing", font=("Helvetica", 20), bg=button_color, fg="white", command=start_order_processing)
start_button.pack(pady=40, ipadx=20, ipady=10)

# Footer (Optional for branding or info)
footer_label = tk.Label(root, text="Powered by Print System", font=("Helvetica", 14), fg=label_color, bg=bg_color)
footer_label.pack(side=tk.BOTTOM, pady=20)

# Starting order processing automatically
start_order_processing()

# Start the Tkinter event loop
root.mainloop()
