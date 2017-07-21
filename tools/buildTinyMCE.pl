#!/usr/bin/perl
##########################################################################
## Filename:      buildTinyMCE.pl
## Description:   Builds TinyMCE and copies output files to the correct 
##                TTWeb and Native directories
##
## Copyright (c) 1996-2016 Seapine Software, Inc.
## All contents of this file are considered Seapine Software proprietary.
##########################################################################   

# This script must be run from the Git TinyMCESource/tools directory, and is assuming that
# a complete TestTrack repository is already in place.
# NOTE: If you made changes to the TinyMCE skin the native configuration Common/Qt/TinyMCE must also be rebuilt

use File::Copy qw(copy);    
use Cwd;
use Getopt::Std;
use Path::Tiny qw(path);

STDOUT->autoflush(1);

$curdir = cwd;

# Get command line options.
getopts('chrwnd:');

# Change to the tinymce directory
chdir('../');

$buildWeb = $opt_w;
$buildNative = $opt_n;

if (!$opt_w && !$opt_n) {
   $buildWeb = 1;
   $buildNative = 1;
}

# First handle help if -h passed
if ( $opt_h ) {
   print "\n****************************************************************************************************\n";
   print "* buildTinyMCE.pl build file\n";
   print "*\n";
   print "* Performs a build of TinyMCE and copies output files to their required locations in the TTWeb and Native Client\n";
   print "* heirearchy.\n";
   print "* \n";
   print "* Options:\n";
   print "*    -d Required: Root directory for TestTrack. Base for where to put the built TinyMCE files\n";
   print "*    -n Build TinyMCE and copy it into the native client directory\n";
   print "*    -w Build TinyMCE and copy it into the web client directory\n";
   print "*    -c Only copy output files (does not build TinyMCE)\n";
   print "*    -r Removes builds after they have been copied does nothing when -c is passed\n";
   print "*    -h Displays help\n";
   print "* \n";
   print "* Copyright 1996-2016 Seapine Software, Inc.\n";
   print "* All contents of this file are considered Seapine Software proprietary.\n";
   print "****************************************************************************************************\n\n";

   exit;
}

$baseDir = $opt_d;
# Since the TinyMCE source is on Git it could be located anywhere, a base directory is needed.
unless ( -e $baseDir) {
   die "No base directory specified. Exiting.\n"
}

$baseDir =~ s/\\/\//g;
$baseDir =~ s/(\/)*$//;
print "Base Dir: $baseDir\n";

# If we're not just copying files, start the build process
if( !$opt_c ) {
   # Clean up any old builds
   print "Cleaning up old builds...\n";
   $buildCommand = 'grunt clean:core clean:plugins clean:skins clean:themes';
   system("$buildCommand") and die "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
   print "done\n";

   # Build TinyMCE
   print "Building TinyMCE...\n";
   $buildCommand = 'grunt minify';
   system("$buildCommand") and die "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
   if ( $buildWeb ) {
      print "Building TinyMCE for web...\n";
      $buildCommand = 'grunt bundle --themes=modern --plugins=advlist,autolink,autoresize,hr,lists,link,image,charmap,print,preview,anchor,searchreplace,visualblocks,code,fullpage,fullscreen,colorpicker,textcolor,insertdatetime,media,table,contextmenu,paste,seapine,seapinetable,sproutcore,copycut';
      system("$buildCommand") and die "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
      copyBuiltFilesWeb();
      print "done\n";
   }
   if ( $buildNative ) {
      print "Building TinyMCE for native...\n";
      $buildCommand = 'grunt bundle --themes=nativemodern --plugins=advlist,autolink,autoresize,hr,lists,link,image,charmap,print,preview,anchor,searchreplace,visualblocks,code,fullpage,fullscreen,colorpicker,textcolor,insertdatetime,media,table,contextmenu,paste,seapine,seapinetable,qtinterface,qtinterfaceeditor,copycut';
      system("$buildCommand") and die "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
      copyBuiltFilesNative();
      print "done\n";
   }
   #$buildCommand = 'grunt bundle --themes modern --plugins autoresize,autolink,fullpage,lists,paste,seapine,sproutcore,table';

   if ( $opt_r ) {
      #clean up the current build
      print "Cleaning up current builds...\n";
      $buildCommand = 'grunt clean:core clean:plugins clean:skins clean:themes';
      system("$buildCommand") and die "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
      print "done\n";
   }

   print "Operation successful. May the force be with you!\n";
   print "__.-._\n";
   print "'-._\"7'\n";
   print " /'.-c\n";
   print " |  /T\n";
   print "_)_/LI\n";
} else {
   copyBuiltFilesWeb();
   copyBuiltFilesNative();
}

sub copyBuiltFilesWeb {
   # Copy files to ttweb directory

   ############################
   ### tiny_mce_combined.js ###
   ############################
   print "Copying tinymce.full.js...\n";
   my $tinymcePath = 'js/tinymce/tinymce.full.js';
   my $scPath = "$baseDir/webClient/sproutcore/frameworks/tinymce-sproutcore/lib/tiny_mce_combined.js";

   unless (-e $tinymcePath) {
      print "\n***Build failed: Cannot find file $tinymcePath\n";
      exit 1;
   }

   # Delete old file first
   if ( -e $scPath ) {
      unlink($scPath) or die "\n***Build failed: Cannot delete $scPath: $!"
   }

   print "Copy $tinymcePath to $scPath\n";
   copy($tinymcePath, $scPath) or die "\n***Copy failed: $!\n";

   print "done\n";

   ####################
   ### skin.min.css ###
   ####################
   print "Copying skin.min.css...\n";
   my $skinPath = 'js/tinymce/skins/lightgray/skin.min.css';
   my $scPath = "$baseDir/webClient/sproutcore/frameworks/tinymce-sproutcore/resources/stylesheet/skin.min.css";
   unless (-e $skinPath) {
      print "\n***Build failed: Cannot find file $skinPath\n";
      exit 1;
   }

   # Delete old file first
   if ( -e $scPath ) {
      unlink($scPath) or die "\n***Build failed: Cannot delete $scPath: $!"
   }

   copy($skinPath, $scPath) or die "\n***Copy failed: $!\n";

   print "done\n";

   #######################
   ### content.min.css ###
   #######################
   my $cssPath = 'js/tinymce/skins/lightgray/content.min.css';
   my $scPath = "$baseDir/webClient/sproutcore/frameworks/tinymce-sproutcore/core.js";
   my $ngPath = "$baseDir/angular/common/tt/WYSIWYGCSS.cnst.js";
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
   
   return;
}

sub copyBuiltFilesNative {

   ############################
   ### tiny_mce_combined.js ###
   ############################
   print "Copying tinymce.full.js...\n";
   my $tinymcePath = 'js/tinymce/tinymce.full.js';
   my $tinymceMinPath = 'js/tinymce/tinymce.full.min.js';
   my $bfPath = "$baseDir/BuildFiles/tinymce/tiny_mce_combined.min.js";

   unless (-e $tinymcePath) {
      print "\n***Build failed: Cannot find file $tinymcePath\n";
      exit 1;
   }
   
   unless (-e $tinymceMinPath) {
      print "\n***Build failed: Cannot find file $tinymceMinPath\n";
      exit 1;
   }
   # Delete old file first
   if ( -e $bfPath ) {
      unlink($bfPath) or die "\n***Build failed: Cannot delete $bfPath: $!"
   }
   print "Copy $tinymceMinPath to $bfPath\n";
   copy($tinymceMinPath, $bfPath) or die "\n***Copy failed: $!\n";
   #Uncomment the line below to copy over the non-minified version of TinyMCE
   #copy($tinymcePath, $bfPath) or die "\n***Copy failed: $!\n";

   print "done\n";

   ####################
   ### skin.min.css ###
   ####################
   print "Copying skin.min.css...\n";
   my $skinPath = 'js/tinymce/skins/lightgray/skin.min.css';
   my $bfPath = "$baseDir/BuildFiles/tinymce/skins/lightgray/skin.min.css";
   unless (-e $skinPath) {
      print "\n***Build failed: Cannot find file $skinPath\n";
      exit 1;
   }
   # Delete old file first
   if ( -e $bfPath ) {
      unlink($bfPath) or die "\n***Build failed: Cannot delete $bfPath: $!"
   }
   copy($skinPath, $bfPath) or die "\n***Copy failed: $!\n";

   print "done\n";

   #######################
   ### content.min.css ###
   #######################
   my $cssPath = 'js/tinymce/skins/lightgray/content.min.css';
   my $qtPath = "$baseDir/common/Qt/TinyMCE/src/tinymceCommonConfig.js";
   print "Copying content.min.css...\n";

   unless (-e $cssPath) {
      print "\n***Build failed: Cannot find file $cssPath\n";
      exit 1;
   }
   unless (-e $qtPath) {
      print "\n***Build failed: Cannot find file $qtPath\n";
      exit 1;
   }
   unless (-e $bfPath) {
      print "\n***Build failed: Cannot find file $bfPath\n";
      exit 1;
   }

   #Get the css data into memory
   $cssFile = path($cssPath);
   $cssData = $cssFile->slurp_utf8;
   #place css in the index file
   $qtFile = path($qtPath);
   $qtData = $qtFile->slurp_utf8;
   $cssData =~ s/body\{/body\{margin:3px;/g;
   #Strip out web specific font-family/font-size, the native client sets its own
   $cssData =~ s/font-family:[^;]*;//g;
   $cssData =~ s/font-size:[^;]*;//g;
   $qtData =~ s/content_style:\s*'[^']*'/content_style: '$cssData'/g;
   $qtFile->spew_utf8($qtData);
   print "***If you changed the skin, please be sure to rebuild the native configuration at $baseDir/common/Qt/TinyMCE\n\n";
   return;
}


