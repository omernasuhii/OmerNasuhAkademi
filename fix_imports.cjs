const fs = require('fs');
let content = fs.readFileSync('src/pages/students/Summary.tsx', 'utf8');

content = content.replace("import { AlertTriangle, useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';");
content = content.replace("import { AlertTriangle, motion } from 'motion/react';", "import { motion } from 'motion/react';");

fs.writeFileSync('src/pages/students/Summary.tsx', content);
