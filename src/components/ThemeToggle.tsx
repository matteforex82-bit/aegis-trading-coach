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
        <div className="grid grid-cols-2 gap-4">
          {/* Classic Theme Preview */}
          <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
            !isVibrant ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`} onClick={() => !isVibrant || toggleTheme()}>
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
          <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
            isVibrant ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
          }`} onClick={() => isVibrant || toggleTheme()}>
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

        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="theme-toggle" className="text-sm font-medium">
              {isVibrant ? 'Tema Vibrante Attivo' : 'Tema Classico Attivo'}
            </Label>
            <p className="text-xs text-gray-500">
              {isVibrant 
                ? 'Stai usando la nuova palette colori vibrante con tonalità moderne'
                : 'Stai usando il tema classico con colori neutri e professionali'
              }
            </p>
          </div>
          <Switch
            id="theme-toggle"
            checked={isVibrant}
            onCheckedChange={toggleTheme}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>

        {/* Theme Description */}
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <div className="font-medium text-blue-900 mb-1">💡 Informazioni sui Temi</div>
          <ul className="space-y-1 text-blue-800">
            <li>• <strong>Classico:</strong> Design pulito e professionale per un uso quotidiano</li>
            <li>• <strong>Vibrante:</strong> Palette moderna con viola, arancione e corallo</li>
            <li>• Il rosa è utilizzato come colore di accento marginale</li>
            <li>• Le impostazioni vengono salvate automaticamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}