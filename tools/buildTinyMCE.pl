#!/usr/bin/perl
##########################################################################
## Filename:      buildTinyMCE.pl
## Description:   Builds TinyMCE and copies output files to the correct 
##                TTWeb directories
##
## Copyright (c) 1996-2014 Seapine Software, Inc.
## All contents of this file are considered Seapine Software proprietary.
##########################################################################   

# This script must be run from the TTPro/WebControls/tinymce/tools directory, and is assuming that
# a complete TestTrack repository is already in place

use File::Copy qw(copy);    
use Cwd;
use Getopt::Std;


STDOUT->autoflush(1);

$curdir = cwd;
$buildCommand = 'jake clean';

# Get command line options.
getopts('ch');

# Change to the tinymce directory
chdir('../');

if ( $opt_h )
{
  print "\n****************************************************************************************************\n";
  print "* buildTinyMCE.pl build file\n";
  print "*\n";
  print "* Performs a build of TinyMCE and copies output files to their required locations in the TTWeb\n";
  print "* heirearchy.\n";
  print "* \n";
  print "* Options:\n";
  print "*    -c Only copy output files (does not build TinyMCE)\n";
  print "*    -h Displays help\n";
  print "* \n";
  print "* Copyright 1996-2014 Seapine Software, Inc.\n";
  print "* All contents of this file are considered Seapine Software proprietary.\n";
  print "****************************************************************************************************\n\n";

  exit;
}

# If we're not just copying files, start the build process
if( !$opt_c )
{
   # Clean up the old builds
   print 'Cleaning up old builds...';
   $buildResult = `$buildCommand`;
   if ($? != 0 )
   {
      print "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
      exit 1;
   }
   print "done\n";

   # Build TinyMCE
   print 'Building TinyMCE...';
   $buildCommand = 'jake bundle-full-jquery[themes:modern,plugins:autoresize,fullpage,lists,paste,seapine,sproutcore,table]';
   $buildResult = `$buildCommand`;
   if ($? != 0 )
   {
      print "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
      exit 1;
   }
   print "done\n";
}

# Copy files to ttweb directory

############################
### tiny_mce_combined.js ###
############################
print 'Copying tinymce.jquery.full.js to tiny_mce_combined.js...';
$filename = 'js/tinymce/tinymce.jquery.full.js';
$destination = '../../cgi/TTWeb/TTWeb/frameworks/tinymce-sproutcore/lib/tiny_mce_combined.js';
unless (-e $filename) {
   print "\n***Build failed: Cannot find file $filename\n";
   exit 1;
}

# Delete old file first
if ( -e $destination ) {
   unlink($destination) or die "\n***Build failed: Cannot delete $destination: $!"
}

copy($filename, $destination) or die "\n***Copy failed: $!\n";
print "done\n";

####################
### skin.min.css ###
####################
print 'Copying skin.min.css...';
$filename = 'js/tinymce/skins/lightgray/skin.min.css';
$destination = '../../cgi/TTWeb/TTWeb/frameworks/tinymce-sproutcore/resources/stylesheet/skin.min.css';
unless (-e $filename) {
   print "\n***Build failed: Cannot find file $filename\n";
   exit 1;
}

# Delete old file first
if ( -e $destination ) {
   unlink($destination) or die "\n***Build failed: Cannot delete $destination: $!"
}

copy($filename, $destination) or die "\n***Copy failed: $!\n";
print "done\n";

###########################
### content.min.css.txt ###
###########################
print 'Copying content.min.css to content.min.css.txt...';
$filename = 'js/tinymce/skins/lightgray/content.min.css';
$destination = '../../cgi/TTWeb/TTWeb/frameworks/tinymce-sproutcore/resources/stylesheet/content.min.css.txt';
unless (-e $filename) {
   print "\n***Build failed: Cannot find file $filename\n";
   exit 1;
}

# Delete old file first
if ( -e $destination ) {
   unlink($destination) or die "\n***Build failed: Cannot delete $destination: $!"
}

# Now copy the new file
copy($filename, $destination) or die "\n***Copy failed: $!\n";
print "done\n";

print "Operation successful. Happy WYSIWYGing!\n\n";
