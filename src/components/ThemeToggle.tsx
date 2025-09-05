'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Palette, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isVibrant = theme === 'vibrant';
  const isNeon = theme === 'neon';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5" />
          <span>Tema Interfaccia</span>
        </CardTitle>
        <CardDescription>
          Scegli tra il tema classico e il nuovo tema vibrante con palette colori moderna
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Preview */}
        <div className="grid grid-cols-3 gap-3">
          {/* Classic Theme Preview */}
          <div className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
            theme === 'classic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`} onClick={() => theme === 'classic' || toggleTheme()}>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">Tema Classico</div>
              <div className="flex space-x-1">
                <div className="w-4 h-4 rounded bg-gray-900"></div>
                <div className="w-4 h-4 rounded bg-gray-600"></div>
                <div className="w-4 h-4 rounded bg-gray-300"></div>
                <div className="w-4 h-4 rounded bg-white border"></div>
              </div>
              <div className="text-xs text-gray-500">Elegante e professionale</div>
            </div>
          </div>

          {/* Vibrant Theme Preview */}
          <div className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
            isVibrant ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
          }`} onClick={() => isVibrant || toggleTheme()}>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                <span>Tema Neon</span>
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse"></div>
              </div>
              <div className="flex space-x-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00D4FF' }}></div>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF0080' }}></div>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00FF88' }}></div>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8B5CF6' }}></div>
              </div>
              <div className="text-xs text-gray-500">Cyber e futuristico</div>
            </div>
          </div>

          {/* Neon Theme Preview */}
          <div className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
            isNeon ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 hover:border-gray-300'
          }`} onClick={() => isNeon || toggleTheme()}>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                <span>Tema Vibrante</span>
                <Sparkles className="h-3 w-3 text-purple-500" />
              </div>
              <div className="flex space-x-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#5144A6' }}></div>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F29B30' }}></div>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F27141' }}></div>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#D94A98' }}></div>
              </div>
              <div className="text-xs text-gray-500">Moderno e dinamico</div>
            </div>
          </div>
        </div>

        {/* Theme Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <Label className="text-sm font-medium">
              {theme === 'classic' && 'Tema Classico Attivo'}
              {theme === 'vibrant' && 'Tema Vibrante Attivo'}
              {theme === 'neon' && 'Tema Neon Attivo'}
            </Label>
            <p className="text-xs text-gray-500">
              {theme === 'classic' && 'Stai usando il tema classico con colori neutri e professionali'}
              {theme === 'vibrant' && 'Stai usando la palette colori vibrante con tonalità moderne'}
              {theme === 'neon' && 'Stai usando il tema cyber con colori neon e effetti futuristici'}
            </p>
          </div>
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="sm"
            className={`transition-all ${
              theme === 'neon' ? 'border-cyan-500 text-cyan-600 hover:bg-cyan-50' :
              theme === 'vibrant' ? 'border-purple-500 text-purple-600 hover:bg-purple-50' :
              'border-blue-500 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Cambia Tema
          </Button>
        </div>

        {/* Theme Description */}
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <div className="font-medium text-blue-900 mb-1">💡 Informazioni sui Temi</div>
          <ul className="space-y-1 text-blue-800">
            <li>• <strong>Classico:</strong> Design pulito e professionale per un uso quotidiano</li>
            <li>• <strong>Vibrante:</strong> Palette moderna con viola, arancione e corallo</li>
            <li>• <strong>Neon:</strong> Tema cyber con colori fluorescenti e effetti luminosi</li>
            <li>• Ogni tema ha la sua palette di colori ottimizzata per il trading</li>
            <li>• Le impostazioni vengono salvate automaticamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}