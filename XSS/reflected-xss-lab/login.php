<?php session_start(); if(\['REQUEST_METHOD']==='POST'){\['blog_user']='guest'; header('Location: index.php'); exit;} ?><form method='post'><button>Login</button></form>
