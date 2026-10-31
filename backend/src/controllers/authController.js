import { prisma } from '../db.js';
import { hashPassword, publicUser, ROLES, signToken, verifyPassword } from '../services/auth.js';
import { HttpError, notFound } from '../utils/httpError.js';

/** Self-registration is for passengers only; operator accounts are provisioned by the agency. */
export async function register(req, res) {
  const { name, email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, 'Bu e-poçt ilə artıq hesab mövcuddur');

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role: ROLES.PASSENGER },
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password, role } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'E-poçt və ya şifrə yanlışdır');
  }
  if (role && user.role !== role) {
    throw new HttpError(
      403,
      role === ROLES.OPERATOR ? 'Bu hesabın operator panelinə girişi yoxdur' : 'Operator hesabı ilə operator girişindən istifadə edin',
    );
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw notFound('İstifadəçi');
  res.json(publicUser(user));
}
