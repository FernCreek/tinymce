#!/usr/bin/perl
##########################################################################
## Filename:      buildTinyMCE.pl
## Description:   Builds TinyMCE and copies output files to the correct 
##                TTWeb directories
##
## Copyright (c) 1996-2016 Seapine Software, Inc.
## All contents of this file are considered Seapine Software proprietary.
##########################################################################   

# This script must be run from the TTPro/WebControls/tinymce/tools directory, and is assuming that
# a complete TestTrack repository is already in place

use File::Copy qw(copy);    
use Cwd;
use Getopt::Std;
use Path::Tiny qw(path);

STDOUT->autoflush(1);

$curdir = cwd;

# Get command line options.
getopts('chwnd:');

# Change to the tinymce directory
chdir('../');

$buildWeb = false;
$buildNative = false;

if ( $opt_w || !($opt_w || $opt_n) ) {
   $buildWeb = true;
}

if ( $opt_n ) {
   $buildNative = true;
}

$baseDir = $opt_d;

unless ( -e $baseDir ) {
   $baseDir = '../../';
}

$baseDir =~ s/\\/\//g;
$baseDir =~ s/(\/)*$//;
print "Base Dir: $baseDir\n";

if ( $opt_h ) {
   print "\n****************************************************************************************************\n";
   print "* buildTinyMCE.pl build file\n";
   print "*\n";
   print "* Performs a build of TinyMCE and copies output files to their required locations in the TTWeb\n";
   print "* heirearchy.\n";
   print "* \n";
   print "* Options:\n";
   print "*    -d Root directory for TestTrack. Base for where to put the built TinyMCE files\n";
   print "*    -n Build TinyMCE and copy it into the native client directory\n";
   print "*    -w Build TinyMCE and copy it into the web client directory\n";
   print "*    -c Only copy output files (does not build TinyMCE)\n";
   print "*    -h Displays help\n";
   print "* \n";
   print "* Copyright 1996-2016 Seapine Software, Inc.\n";
   print "* All contents of this file are considered Seapine Software proprietary.\n";
   print "****************************************************************************************************\n\n";

   exit;
}

# If we're not just copying files, start the build process
if( !$opt_c ) {
   # Clean up the old builds
   print "Cleaning up old builds...\n";
   $buildCommand = 'grunt clean:core clean:plugins clean:skins clean:themes';
   system("$buildCommand") and die "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
   print "done\n";

   # Build TinyMCE
   print "Building TinyMCE...\n";
   $buildCommand = 'grunt minify';
   system("$buildCommand") and die "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
   $buildCommand = 'grunt bundle --themes modern --plugins advlist,autolink,autoresize,lists,link,image,imagetools,charmap,print,preview,anchor,searchreplace,visualblocks,code,fullpage,fullscreen,colorpicker,textcolor,insertdatetime,media,table,contextmenu,paste,seapine,sproutcore';
   #$buildCommand = 'grunt bundle --themes modern --plugins autoresize,autolink,fullpage,lists,paste,seapine,sproutcore,table';
   system("$buildCommand") and die "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
   print "done\n";
}
# Copy files to ttweb directory

############################
### tiny_mce_combined.js ###
############################
print "Copying tinymce.full.js...\n";
$tinymcePath = 'js/tinymce/tinymce.full.js';
$scPath = "$baseDir/cgi/TTWeb/TTWeb/frameworks/tinymce-sproutcore/lib/tiny_mce_combined.js";

unless (-e $tinymcePath) {
   print "\n***Build failed: Cannot find file $tinymcePath\n";
   exit 1;
}

if( $buildWeb ){
   # Delete old file first
   if ( -e $scPath ) {
      unlink($scPath) or die "\n***Build failed: Cannot delete $scPath: $!"
   }

   print "Copy $tinymcePath to $scPath\n";
   copy($tinymcePath, $scPath) or die "\n***Copy failed: $!\n";
}

if ( $buildNative ) {
   print "Insert tinymce copy step for the native client here\n";
}

print "done\n";

####################
### skin.min.css ###
####################
print "Copying skin.min.css...\n";
$skinPath = 'js/tinymce/skins/lightgray/skin.min.css';
$scPath = "$baseDir/cgi/TTWeb/TTWeb/frameworks/tinymce-sproutcore/resources/stylesheet/skin.min.css";
unless (-e $skinPath) {
   print "\n***Build failed: Cannot find file $skinPath\n";
   exit 1;
}

if ( $buildWeb ) {
   # Delete old file first
   if ( -e $scPath ) {
      unlink($scPath) or die "\n***Build failed: Cannot delete $scPath: $!"
   }

   copy($skinPath, $scPath) or die "\n***Copy failed: $!\n";
}

if ( $buildNative ) {
   print "Insert skin copy step for the native client here\n";
}

print "done\n";

#######################
### content.min.css ###
#######################
$cssPath = 'js/tinymce/skins/lightgray/content.min.css';
$scPath = "$baseDir/cgi/TTWeb/TTWeb/frameworks/tinymce-sproutcore/core.js";
$ngPath = "$baseDir/angular/common/tt/WYSIWYGCSS.cnst.js";
print "Copying content.min.css...\n";

unless (-e $cssPath) {
   print "\n***Build failed: Cannot find file $cssPath\n";
   exit 1;
}

unless (-e $scPath) {
   print "\n***Build failed: Cannot find file $scPath\n";
   exit 1;
}

unless (-e $ngPath) {
   print "\n***Build failed: Cannot find file $ngPath\n";
   exit 1;
}

#Get the css data into memory
$cssFile = path($cssPath);
$cssData = $cssFile->slurp_utf8;

if ( $buildWeb ) {
   #place css in the SproutCore file
   $scFile = path($scPath);
   $scData = $scFile->slurp_utf8;
   $scData =~ s/content_style:\s*'[^']*'/content_style: '$cssData'/g;
   $scFile->spew_utf8($scData);

   #place css in the Angular file
   $ngFile = path($ngPath);
   $ngData = $ngFile->slurp_utf8;
   $ngData =~ s/WYSIWYGCSS\s*=\s*'[^']*'/WYSIWYGCSS = '$cssData'/g;
   $ngFile->spew_utf8($ngData);
}

if ( $buildNative ) {
   print "Insert css copy step for the native client here\n";
}

print "done\n";

print "Operation successful. Happy WYSIWYGing!\n\n";
