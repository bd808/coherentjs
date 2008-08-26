<?php
if (empty($_SERVER['QUERY_STRING']))
{
    session_start();
    $_SESSION['partNumber']= 'MA896LL/A';
    include('configurator.html');
    exit;
}

header('ContentType: application/x-json');

session_start();
if (isset($_SESSION['partNumber']) &&
    $_SESSION['partNumber']!=$_GET['partNumber'])
{
    $partNumber= $_SESSION['partNumber']= $_GET['partNumber'];

    $file= 'json/' . preg_replace('/[^\w-.]+/', '_', $partNumber) . '.json';
    if (file_exists($file))
    {
        include($file);
        exit;
    }
}

$file= '';
foreach($_GET as $key=>$value)
{
    if ('partNumber'==$key)
        continue;
    if (!empty($file))
        $file.='_';
    $file.=$value;
}

$file= 'json/' . $file . '.json';

if (!file_exists($file))
{
    error_log('missing file: ' . $file);
    echo "{ file:'$file', exists: false }";
    exit;
}

$json_text= file_get_contents($file);
$json= json_decode($json_text, true);
$partNumber= $json['partNumber'];
$_SESSION['partNumber']= $partNumber;

echo $json_text;
?>
