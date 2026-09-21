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

$testRecipientEmail = $data['email'] ?? 'rahulbadugu22@gmail.com';
$fromEmail = "zingbiteuk@gmail.com";
$fromName = "Sangeetha Events Pinner";
$subject = "Admin Test Email - Sangeetha Events Pinner (GoDaddy PHP)";

$htmlContent = '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
  <h2 style="color: #06874D; text-align: center; border-bottom: 2px solid #06874D; padding-bottom: 10px;">Test Email Successful!</h2>
  <p style="font-size: 16px; color: #333;">Hello Admin,</p>
  <p style="font-size: 16px; color: #333;">This is a test email sent from the Admin Dashboard using the GoDaddy PHP API Fallback handler.</p>
  <p style="font-size: 16px; color: #333;">If you are receiving this, your SMTP/PHP mail configuration is working perfectly for the static deployment.</p>
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #777;">
    <p>Sangeetha Events Pinner &bull; GoDaddy cPanel Hosted</p>
  </div>
</div>
';

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: " . $fromName . " <" . $fromEmail . ">" . "\r\n";

if (mail($testRecipientEmail, $subject, $htmlContent, $headers)) {
    echo json_encode(['success' => true, 'message' => 'Test email sent successfully via PHP fallback']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send test email via PHP mail()']);
}
?>
