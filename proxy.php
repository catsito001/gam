<?php
// proxy.php

if (empty($_GET['url'])) {
  http_response_code(400);
  exit('Falta parámetro url');
}

// 1) Limpiar authuser de la URL
$url = preg_replace('/([?&])authuser=\d+(&?)/', '$1', $_GET['url']);
$url = rtrim($url, '&?');

// Permitir CORS
header('Access-Control-Allow-Origin: *');

$ch = curl_init();
curl_setopt_array($ch, [
  CURLOPT_URL            => $url,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HEADER         => true,          // para separar cabeceras y cuerpo
  CURLOPT_FOLLOWLOCATION => true,          // deja que siga redirects automáticamente
  CURLOPT_MAXREDIRS      => 10,            // hasta 10 redirecciones
  CURLOPT_SSL_VERIFYPEER => false,
  CURLOPT_SSL_VERIFYHOST => false,
  CURLOPT_TIMEOUT        => 30,
  CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '.
                           'AppleWebKit/537.36 (KHTML, like Gecko) '.
                           'Chrome/114.0.0.0 Safari/537.36',
  CURLOPT_HTTPHEADER     => [
    'Referer: https://www.google.com/',
    'Accept: image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  ],
]);

$response = curl_exec($ch);
if ($response === false) {
  $err = curl_error($ch);
  curl_close($ch);
  http_response_code(502);
  exit("cURL Error: $err");
}

$info = curl_getinfo($ch);
curl_close($ch);

// separar cabeceras y cuerpo
$hdrSize = $info['header_size'];
$headers = substr($response, 0, $hdrSize);
$body    = substr($response, $hdrSize);

$httpCode    = $info['http_code'];
$contentType = $info['content_type'] ?? '';

// Si no es imagen, devolvemos error
if (strpos($contentType, 'image/') !== 0) {
  http_response_code(502);
  exit("No devolvió imagen (HTTP $httpCode, Content-Type: $contentType)");
}

// Devolver la imagen al cliente
header('Content-Type: ' . $contentType);
echo $body;
