<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload']);
    exit;
}

// Extract booking details
$bookingId = $data['bookingId'] ?? 'N/A';
$name = $data['name'] ?? 'Unknown';
$email = $data['email'] ?? 'Not provided';
$phone = $data['phone'] ?? 'Not provided';
$eventType = $data['eventType'] ?? 'Not provided';
$serviceType = $data['serviceType'] ?? 'Not provided';
$date = $data['date'] ?? 'Not provided';
$timeOfDay = $data['timeOfDay'] ?? 'Not provided';
$guests = $data['guests'] ?? 'Not provided';
$message = $data['message'] ?? 'None';
$package = $data['selectedPackage'] ?? $data['package'] ?? 'Not Selected';
$postCode = $data['postCode'] ?? 'Not provided';
$address = $data['address'] ?? 'Not provided';
$baseAmount = $data['baseAmount'] ?? 0;
$deposit = $data['deposit'] ?? 0;

// Default Notification Emails
$recipients = "Svrpinneruk@gmail.com, rahulbadugu22@gmail.com, Digitalbotsolutions@gmail.com";

// Sender configuration
$fromEmail = "zingbiteuk@gmail.com"; // Set your default sender email or get from config
$fromName = "Sangeetha Events Pinner";

$subject = "New " . $serviceType . " Request from " . $name;

$htmlContent = '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
  <h2 style="color: #C62127; text-align: center; border-bottom: 2px solid #C62127; padding-bottom: 10px;">New Booking Request</h2>
  <p style="font-size: 16px; color: #333;">Hello,</p>
  <p style="font-size: 16px; color: #333;">You have received a new booking request from your website. Here are the details:</p>
  
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
    <tbody>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9; width: 40%;">Name</td><td style="padding: 10px; border: 1px solid #ddd;">' . htmlspecialchars($name) . '</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Email</td><td style="padding: 10px; border: 1px solid #ddd;">' . htmlspecialchars($email) . '</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Phone</td><td style="padding: 10px; border: 1px solid #ddd;">' . htmlspecialchars($phone) . '</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Event Date</td><td style="padding: 10px; border: 1px solid #ddd;">' . htmlspecialchars($date) . ' (' . htmlspecialchars($timeOfDay) . ')</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Event Type</td><td style="padding: 10px; border: 1px solid #ddd;">' . htmlspecialchars($eventType) . '</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Service Type</td><td style="padding: 10px; border: 1px solid #ddd;">' . htmlspecialchars($serviceType) . '</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Package Selected</td><td style="padding: 10px; border: 1px solid #ddd;">' . htmlspecialchars($package) . '</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">No. of Guests</td><td style="padding: 10px; border: 1px solid #ddd;">' . htmlspecialchars($guests) . '</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Location/Postcode</td><td style="padding: 10px; border: 1px solid #ddd;">' . htmlspecialchars($postCode) . '<br/>' . htmlspecialchars($address) . '</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Estimated Amount</td><td style="padding: 10px; border: 1px solid #ddd;">£' . number_format($baseAmount, 2) . ' (Excl. VAT)</td></tr>
    </tbody>
  </table>
  
  <div style="margin-top: 20px; padding: 15px; background-color: #f4f8f5; border-radius: 5px; border-left: 4px solid #06874D;">
    <p style="margin: 0; font-weight: bold; color: #06874D;">Additional Message:</p>
    <p style="margin-top: 5px; color: #555;">' . nl2br(htmlspecialchars($message)) . '</p>
  </div>
  
  <p style="margin-top: 30px; font-size: 14px; color: #777; text-align: center;">
    This is an automated notification from your website. Please do not reply directly to this email unless responding to the customer\'s email address.
  </p>
</div>
';

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: " . $fromName . " <" . $fromEmail . ">" . "\r\n";
$headers .= "Reply-To: " . htmlspecialchars($name) . " <" . htmlspecialchars($email) . ">" . "\r\n";

if (mail($recipients, $subject, $htmlContent, $headers)) {
    echo json_encode(['success' => true, 'message' => 'Enquiry sent successfully via PHP fallback']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send email via PHP mail()']);
}
?>
